import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing env vars")
    process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function reset() {
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers()

    if (usersError) {
        console.error("Error fetching users:", usersError)
        return
    }

    for (const user of usersData.users) {
        if (user.email === 'iule@imi.com' || user.email === 'admin@imi.com.br') {
            const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
                password: 'admin123',
                email_confirm: true
            })
            if (error) {
                console.error(`Failed to update ${user.email}:`, error)
            } else {
                console.log(`Successfully reset password for ${user.email}`)
            }
        }
    }
}

reset()
