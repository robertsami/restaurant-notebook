import { SignInForm } from '@/components/auth/signin-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | Restaurant Notebook',
  description: 'Sign in to your Restaurant Notebook account',
};

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <SignInForm />
    </div>
  );
}