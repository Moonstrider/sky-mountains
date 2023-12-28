import { ID, Query } from 'appwrite';
import { INewPost, INewUser, IUpdatePost, IUpdateUser } from "@/types";
import { account, appwriteConfig, avatars, databases, storage } from './config';

export async function createUserAccount(user: INewUser) {
    try {
        const newAccount = await account.create(
            ID.unique(),
            user.email,
            user.password,
            user.name,
        );

        if (!newAccount) throw Error;

        const avatarUrl = avatars.getInitials(user.name);

        const newUser = await saveUserToDB({
            accountId: newAccount.$id,
            name: newAccount.name,
            email: newAccount.email,
            username: user.username,
            imageUrl: avatarUrl,
        });

        return newUser;
    } catch (error) {
        console.log(error);
        return error;
    }
}

export async function saveUserToDB(user: {
    accountId: string,
    name: string,
    email: string,
    username?: string,
    imageUrl: URL,
}) {
    try {
        const newUser = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            ID.unique(),
            user
        );

        return newUser;
    } catch (error) {
        console.log(error);

    }

}

export async function signInAccount(user: { email: string, password: string }) {
    try {
        const session = await account.createEmailSession(user.email, user.password);
        return session;
    } catch (error) {
        console.log(error);
    }
}

export async function getCurrentUser() {
    try {
        const currentAccount = await account.get();
        if (!currentAccount) throw Error;

        const currentUser = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal('accountId', currentAccount.$id)]
        )
        if (!currentUser) throw Error;

        return currentUser.documents[0];
    } catch (error) {
        console.log(error);

    }
}

export async function signOutAccount() {
    try {
        const session = await account.deleteSession("current");
        return session;
    } catch (error) {
        console.log(error);
    }

}

export async function createPost(post: INewPost) {
    try {
        // upload image to storage
        const uploadedFile = await uploadFile(post.file[0]);

        if (!uploadedFile) throw Error;

        // get file url
        const fileUrl = getFilePreview(uploadedFile.$id);

        if (!fileUrl) {
            deleteFile(uploadedFile.$id);
            throw Error;
        }

        // convert tags to array
        const tags = post.tags?.replace(/ /g, '').split(',') || [];

        // save post to db
        const newPost = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            ID.unique(),
            {
                creator: post.userId,
                caption: post.caption,
                imageUrl: fileUrl,
                imageId: uploadedFile.$id,
                location: post.location,
                tags: tags
            }
        );

        if (!newPost) {
            await deleteFile(uploadedFile.$id)
            throw Error
        }

        return newPost
    } catch (error) {
        console.log(error);
    }
}

export async function uploadFile(file: File) {
    try {
        const uploadedFile = await storage.createFile(
            appwriteConfig.storageId,
            ID.unique(),
            file
        );
        return uploadedFile;
    } catch (error) {
        console.log(error);
    }
}

export function getFilePreview(fileId: string) {
    try {
        const fileUrl = storage.getFilePreview(
            appwriteConfig.storageId,
            fileId,
            2000,
            2000,
            "top",
            100
        );
        return fileUrl;
    } catch (error) {
        console.log(error);
    }
}

export async function deleteFile(fileId: string) {
    try {
        await storage.deleteFile(appwriteConfig.storageId, fileId);
        return { status: 'ok' }
    } catch (error) {
        console.log(error);
    }
}

export async function getRecentPosts() {
    const posts = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.postCollectionId,
        [Query.orderDesc('$createdAt'), Query.limit(20)]
    )

    if (!posts) throw Error

    return posts;
}

export async function likePost(postId: string, likesArray: string[]) {
    try {
        const updatedPost = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            postId,
            {
                likes: likesArray
            }
        );

        if (!updatedPost) throw Error;

        return updatedPost;
    } catch (error) {
        console.log(error);
    }
}

export async function savePost(postId: string, userId: string) {
    try {
        const updatedPost = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.savesCollectionId,
            ID.unique(),
            {
                user: userId,
                post: postId,
            }
        );

        if (!updatedPost) throw Error;

        return updatedPost;
    } catch (error) {
        console.log(error);
    }
}

export async function deleteSavedPost(savedRecordId: string) {
    try {
        const statusCode = await databases.deleteDocument(
            appwriteConfig.databaseId,
            appwriteConfig.savesCollectionId,
            savedRecordId,
        );

        if (!statusCode) throw Error;

        return { status: 'ok' };
    } catch (error) {
        console.log(error);
    }
}

export async function getPostById(postId: string) {
    try {
        const post = await databases.getDocument(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            postId
        )
        return post
    } catch (error) {
        console.log(error);
    }
}

export async function updatePost(post: IUpdatePost) {

    const hasFileToUpdate = post.file.length > 0;

    try {
        let image = {
            imageId: post.imageId,
            imageUrl: post.imageUrl,
        }

        if (hasFileToUpdate) {
            // upload image to storage
            const uploadedFile = await uploadFile(post.file[0]);

            if (!uploadedFile) throw Error;

            // get file url
            const fileUrl = getFilePreview(uploadedFile.$id);

            if (!fileUrl) {
                deleteFile(uploadedFile.$id);
                throw Error;
            }

            image = { ...image, imageUrl: fileUrl, imageId: uploadedFile.$id }
        }

        // convert tags to array
        const tags = post.tags?.replace(/ /g, '').split(',') || [];

        // save post to db
        const updatedPost = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            post.postId,
            {
                caption: post.caption,
                imageUrl: image.imageUrl,
                imageId: image.imageId,
                location: post.location,
                tags: tags
            }
        );

        if (!updatedPost) {
            await deleteFile(post.imageId)
            throw Error
        }

        return updatedPost
    } catch (error) {
        console.log(error);
    }
}

export async function deletePost(postId: string, imageId: string) {
    if (!postId || !imageId) throw Error;

    try {
        await databases.deleteDocument(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            postId
        )
        return { status: 'ok' }
    } catch (error) {
        console.log(error);

    }
}

export async function getInfinitePosts({ pageParam }: { pageParam: number }) {
    // Explore页面 瀑布式分页查询，每次查10个post
    // 利用"react-intersection-observer"的useInView 的ref和inView来实现瀑布式分页
    const queries: any[] = [Query.orderDesc("$updatedAt"), Query.limit(9)];

    if (pageParam) {
        queries.push(Query.cursorAfter(pageParam.toString()));
    }

    try {
        const posts = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            queries
        );

        if (!posts) throw Error;

        return posts;
    } catch (error) {
        console.log(error);
    }
}

export async function searchPosts(searchTerms: string) {
    try {
        const posts = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            [Query.search('caption', searchTerms)]
        )

        if (!posts) throw Error

        return posts
    } catch (error) {
        console.log(error);
    }
}

export async function getUsers(limit?: number) {

    const queries: any[] = [Query.orderDesc("$createdAt")];

    if (limit) {
        queries.push(Query.limit(limit));
    }

    try {
        const users = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            queries
        );

        if (!users) throw Error;

        return users;
    } catch (error) {
        console.log(error);
    }
}

export async function getUserById(userId: string) {
    try {
        const user = await databases.getDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            userId
        );

        if (!user) throw Error;

        return user;
    } catch (error) {
        console.log(error);
    }
}

export async function updateUser(user: IUpdateUser) {
    const hasFileToUpdate = user.file.length > 0;
    try {
        let image = {
            imageUrl: user.imageUrl,
            imageId: user.imageId,
        };

        if (hasFileToUpdate) {
            // upload new file to appwrite storage
            const uploadedFile = await uploadFile(user.file[0]);
            if (!uploadFile) {
                throw Error;
            }

            // get new file url
            //@ts-ignore
            const fileUrl = getFilePreview(uploadedFile.$id);
            if (!fileUrl) {
                //@ts-ignore
                await deleteFile(uploadedFile.$id);
                throw Error;
            }

            //@ts-ignore
            image = { ...image, imageUrl: fileUrl, imageId: uploadedFile.$id }
        }

        // update user
        const updatedUser = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            user.userId,
            {
                name: user.name,
                bio: user.bio,
                imageUrl: image.imageUrl,
                imageId: image.imageId,
            }
        )

        // failed to update
        if (!updatedUser) {
            // delete new file that has been recently uploaded
            if (hasFileToUpdate) {
                await deleteFile(image.imageId);
            }
            // if no new file uploaded, just throw error
            throw Error;
        }

        // safely delete old file after successfully update
        if (user.imageId && hasFileToUpdate) {
            await deleteFile(user.imageId);
        }

        return updatedUser;
    } catch (error) {
        console.log(error);

    }
}