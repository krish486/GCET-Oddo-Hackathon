import { Link, useNavigate } from 'react-router';
import { useState } from 'react';

import { api } from '../../../shared/api/client';
import { useAuth } from '../state/authContext';


function AuthFrame({
    eyebrow,
    title,
    description,
    children,
    footer,
}) {
    return (
        <main className="auth-page">
            <section className="auth-brand">
                <div className="brand">
                    <span>S</span>
                    StockSense
                </div>

                <div>
                    <p>{eyebrow}</p>

                    <h1>
                        Stock decisions, clear and traceable.
                    </h1>

                    <span>
                        Bring products, locations and every movement
                        into one confident inventory workspace.
                    </span>
                </div>

                <small>
                    Live stock. Complete history. Better decisions.
                </small>
            </section>

            <section className="auth-form">
                <div className="auth-card">
                    <p className="eyebrow">
                        {eyebrow}
                    </p>

                    <h2>
                        {title}
                    </h2>

                    <p className="muted">
                        {description}
                    </p>

                    {children}

                    {footer && (
                        <div className="auth-footer">
                            {footer}
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}


function Field({
    label,
    ...props
}) {
    return (
        <label className="field">
            <span>
                {label}
            </span>

            <input
                {...props}
            />
        </label>
    );
}


function Notice({
    message,
    type = 'error',
}) {
    if (!message) {
        return null;
    }

    return (
        <div className={`notice ${type} `}>
            {message}
        </div>
    );
}



export function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: 'manager@stocksense.app',
        password: 'Demo123!',
    });

    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const submit = async (event) => {
        event.preventDefault();

        setBusy(true);
        setError('');

        try {
            await login(form);

            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <AuthFrame
            eyebrow="Welcome back"
            title="Sign in to StockSense"
            description="Use the demo manager account or your own workspace credentials."
            footer={
                <>
                    New here?{' '}
                    <Link to="/signup">
                        Create an account
                    </Link>
                </>
            }
        >
            <form
                onSubmit={submit}
                className="form-stack"
            >
                <Notice message={error} />

                <Field
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                        setForm({
                            ...form,
                            email: e.target.value,
                        })
                    }
                    required
                />

                <Field
                    label="Password"
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                        setForm({
                            ...form,
                            password: e.target.value,
                        })
                    }
                    required
                />

                <Link
                    className="inline-link"
                    to="/forgot-password"
                >
                    Forgot your password?
                </Link>

                <button
                    className="button primary"
                    disabled={busy}
                >
                    {busy
                        ? 'Signing in…'
                        : 'Sign in'}
                </button>
            </form>
        </AuthFrame>
    );
}



export function SignupPage() {
    const { signup } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
    });

    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const change = (event) => {
        setForm({
            ...form,
            [event.target.name]: event.target.value,
        });
    };

    const submit = async (event) => {
        event.preventDefault();

        setBusy(true);
        setError('');

        try {
            await signup(form);

            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <AuthFrame
            eyebrow="Get started"
            title="Create your workspace access"
            description="Create your StockSense account and start managing inventory."
            footer={
                <>
                    Already have an account?{' '}
                    <Link to="/login">
                        Sign in
                    </Link>
                </>
            }
        >
            <form
                onSubmit={submit}
                className="form-stack"
            >
                <Notice message={error} />

                <Field
                    label="Name"
                    name="name"
                    value={form.name}
                    onChange={change}
                    required
                />

                <Field
                    label="Work email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={change}
                    required
                />

                <Field
                    label="Password"
                    name="password"
                    type="password"
                    minLength="8"
                    value={form.password}
                    onChange={change}
                    required
                />

                <button
                    className="button primary"
                    disabled={busy}
                >
                    {busy
                        ? 'Creating account…'
                        : 'Create account'}
                </button>
            </form>
        </AuthFrame>
    );
}



export function ForgotPasswordPage() {
    const navigate = useNavigate();

    const [email, setEmail] = useState(
        'manager@stocksense.app'
    );

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const submit = async (event) => {
        event.preventDefault();

        setBusy(true);
        setError('');

        try {
            const result = await api(
                '/auth/forgot-password',
                {
                    method: 'POST',
                    body: {
                        email,
                    },
                }
            );

            sessionStorage.setItem(
                'reset-email',
                email
            );

            if (result.developmentOtp) {
                sessionStorage.setItem(
                    'reset-otp',
                    result.developmentOtp
                );
            }

            setMessage(
                result.developmentOtp
                    ? `Development code: ${result.developmentOtp} `
                    : 'Check your email for the verification code.'
            );
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <AuthFrame
            eyebrow="Password reset"
            title="Recover your account"
            description="We’ll send a six-digit verification code to your email."
            footer={
                <Link to="/login">
                    Back to sign in
                </Link>
            }
        >
            <form
                onSubmit={submit}
                className="form-stack"
            >
                <Notice message={error} />

                <Notice
                    message={message}
                    type="success"
                />

                <Field
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) =>
                        setEmail(e.target.value)
                    }
                    required
                />

                <button
                    className="button primary"
                    disabled={busy}
                >
                    {busy
                        ? 'Sending…'
                        : 'Send verification code'}
                </button>

                {message && (
                    <button
                        type="button"
                        className="button secondary"
                        onClick={() =>
                            navigate('/verify-otp')
                        }
                    >
                        Continue to verification
                    </button>
                )}
            </form>
        </AuthFrame>
    );
}

/* -------------------------------------------------------------------------- */
/*                              Verify OTP Page                               */
/* -------------------------------------------------------------------------- */

export function VerifyOtpPage() {
    const navigate = useNavigate();

    const [email, setEmail] = useState(
        sessionStorage.getItem('reset-email') || ''
    );

    const [otp, setOtp] = useState(
        sessionStorage.getItem('reset-otp') || ''
    );

    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const submit = async (event) => {
        event.preventDefault();

        setBusy(true);
        setError('');

        try {
            const result = await api(
                '/auth/verify-otp',
                {
                    method: 'POST',
                    body: {
                        email,
                        otp,
                    },
                }
            );

            sessionStorage.setItem(
                'reset-token',
                result.resetToken
            );

            navigate('/reset-password');
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <AuthFrame
            eyebrow="Verification"
            title="Enter your code"
            description="The code expires in ten minutes."
            footer={
                <Link to="/forgot-password">
                    Request a new code
                </Link>
            }
        >
            <form
                onSubmit={submit}
                className="form-stack"
            >
                <Notice message={error} />

                <Field
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) =>
                        setEmail(e.target.value)
                    }
                    required
                />

                <Field
                    label="Six-digit code"
                    inputMode="numeric"
                    maxLength="6"
                    value={otp}
                    onChange={(e) =>
                        setOtp(e.target.value)
                    }
                    required
                />

                <button
                    className="button primary"
                    disabled={busy}
                >
                    {busy
                        ? 'Verifying…'
                        : 'Verify code'}
                </button>
            </form>
        </AuthFrame>
    );
}


export function ResetPasswordPage() {
    const { setSession } = useAuth();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const submit = async (event) => {
        event.preventDefault();

        setBusy(true);
        setError('');

        try {
            const result = await api(
                '/auth/reset-password',
                {
                    method: 'POST',
                    body: {
                        resetToken:
                            sessionStorage.getItem(
                                'reset-token'
                            ),
                        password,
                    },
                }
            );

            sessionStorage.removeItem(
                'reset-token'
            );

            setSession(result);

            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <AuthFrame
            eyebrow="New password"
            title="Set a secure password"
            description="You’ll return directly to your dashboard."
            footer={
                <Link to="/login">
                    Back to sign in
                </Link>
            }
        >
            <form
                onSubmit={submit}
                className="form-stack"
            >
                <Notice message={error} />

                <Field
                    label="New password"
                    type="password"
                    minLength="8"
                    value={password}
                    onChange={(e) =>
                        setPassword(e.target.value)
                    }
                    required
                />

                <button
                    className="button primary"
                    disabled={busy}
                >
                    {busy
                        ? 'Saving…'
                        : 'Reset password'}
                </button>
            </form>
        </AuthFrame>
    );
}
