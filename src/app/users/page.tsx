import { redirect } from 'next/navigation'

// /users → console dashboard (middleware enforces auth and bounces to login).
export default function UsersIndex() {
  redirect('/users/dashboard')
}
