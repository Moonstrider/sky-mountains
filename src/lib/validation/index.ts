import * as z from "zod"

export const SignupValidation = z.object({
    name: z.string().min(2, { message: 'least 2 characters' }).max(50, { message: 'less than 50 characters' }),
    username: z.string().min(2, { message: 'least 2 characters' }).max(50, { message: 'less than 50 characters' }),
    email: z.string().email(),
    password: z.string().min(8, { message: 'least 8 characters' }).max(50, { message: 'less than 50 characters' }),
})

export const SigninValidation = z.object({
    email: z.string().email(),
    password: z.string().min(8, { message: 'least 8 characters' }).max(50, { message: 'less than 50 characters' }),
})

export const PostValidation = z.object({
    caption: z.string().min(5).max(2200),
    file: z.custom<File[]>(),
    location: z.string().min(2).max(100),
    tags: z.string(),
})