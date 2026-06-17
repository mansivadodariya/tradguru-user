const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Accepts E.164 (+919876543210) and plain formats
const PHONE_RE = /^\+?[0-9\s\-().]{7,20}$/;
// Strong password: min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

export function validateSignup(form) {
    const errors = {};

    const firstName = form.first_name.trimStart();
    const lastName = form.last_name.trimStart();
    const email = form.email.trimStart();
    const phone = form.phone_number.trimStart();
    const password = form.password;
    const confirm = form.confirmPassword;

    if (!firstName) {
        errors.first_name = 'First name is required.';
    } else if (firstName.length < 2) {
        errors.first_name = 'First name must be at least 2 characters.';
    } else if (firstName.length > 50) {
        errors.first_name = 'First name cannot exceed 50 characters.';
    } else if (!/^[a-zA-Z\s]+$/.test(firstName)) {
        errors.first_name = 'First name can only contain letters and spaces.';
    }

    if (!lastName) {
        errors.last_name = 'Last name is required.';
    } else if (lastName.length < 2) {
        errors.last_name = 'Last name must be at least 2 characters.';
    } else if (lastName.length > 50) {
        errors.last_name = 'Last name cannot exceed 50 characters.';
    } else if (!/^[a-zA-Z\s]+$/.test(lastName)) {
        errors.last_name = 'Last name can only contain letters and spaces.';
    }

    if (!email) {
        errors.email = 'Email is required.';
    } else if (!EMAIL_RE.test(email)) {
        errors.email = 'Enter a valid email address.';
    }

    if (!phone) {
        errors.phone_number = 'Phone number is required.';
    } else if (!PHONE_RE.test(phone)) {
        errors.phone_number = 'Enter a valid phone number.';
    }

    if (!password) {
        errors.password = 'Password is required.';
    } else if (!PASSWORD_RE.test(password)) {
        errors.password = 'Password must be 8+ chars with uppercase, lowercase, number and special character.';
    }

    if (!confirm) {
        errors.confirmPassword = 'Please confirm your password.';
    } else if (confirm !== password) {
        errors.confirmPassword = 'Passwords do not match.';
    }

    return errors;
}

export function validateLogin(form) {
    const errors = {};

    const email = form.email.trimStart();
    const password = form.password;

    if (!email) {
        errors.email = 'Email is required.';
    } else if (!EMAIL_RE.test(email)) {
        errors.email = 'Enter a valid email address.';
    }

    if (!password) {
        errors.password = 'Password is required.';
    }

    return errors;
}

export function validateForgotPassword(email) {
    if (!email.trimStart()) return 'Email is required.';
    if (!EMAIL_RE.test(email.trimStart())) return 'Enter a valid email address.';
    return '';
}

export function validateResetPassword(form) {
    const errors = {};

    if (!form.new_password) {
        errors.new_password = 'New password is required.';
    } else if (!PASSWORD_RE.test(form.new_password)) {
        errors.new_password = 'Password must be 8+ chars with uppercase, lowercase, number and special character.';
    }

    if (!form.confirm_password) {
        errors.confirm_password = 'Please confirm your password.';
    } else if (form.confirm_password !== form.new_password) {
        errors.confirm_password = 'Passwords do not match.';
    }

    return errors;
}
