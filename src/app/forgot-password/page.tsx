export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-6 py-16 text-center">
      <h1 className="text-3xl font-bold text-white">Reset password</h1>
      <p className="mt-4 text-gray-400">
        Enter the email or phone on your account. In this demo, use the login screen with the password you registered.
        When Supabase Auth is connected, reset links will be sent by email or SMS.
      </p>
    </div>
  );
}
