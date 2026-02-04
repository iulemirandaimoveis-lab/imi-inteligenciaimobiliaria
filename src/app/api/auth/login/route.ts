import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json()

        // Validação básica
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email e senha são obrigatórios' },
                { status: 400 }
            )
        }

        // Buscar usuário no banco
        const user = await prisma.user.findUnique({
            where: { email },
        })

        if (!user || !user.passwordHash) {
            return NextResponse.json(
                { error: 'Credenciais inválidas' },
                { status: 401 }
            )
        }

        // Verificar senha
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

        if (!isPasswordValid) {
            return NextResponse.json(
                { error: 'Credenciais inválidas' },
                { status: 401 }
            )
        }

        // Verificar se JWT_SECRET está configurado
        const jwtSecret = process.env.JWT_SECRET
        if (!jwtSecret) {
            console.error('JWT_SECRET não está configurado nas variáveis de ambiente')
            return NextResponse.json(
                { error: 'Erro de configuração do servidor' },
                { status: 500 }
            )
        }

        // Gerar JWT token
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role,
            },
            jwtSecret,
            { expiresIn: '7d' }
        )

        // Criar resposta com cookie
        const response = NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        })

        // Definir cookie HTTP-only
        response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 dias
            path: '/',
        })

        return response
    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json(
            { error: 'Erro ao fazer login' },
            { status: 500 }
        )
    }
}
