import { redirect } from 'next/navigation';

export default function HomePage() {
  // Ana adrese gelen ziyareçtiyi doğrudan araştırmacı paneline yönlendirir
  redirect('/dashboard');
}