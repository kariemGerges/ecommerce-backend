const validatePassword = (password) => {
    const minLength = 8;
    const maxLength = 128;
    const hasUppercase = /[A-Z]/;
    const hasLowercase = /[a-z]/;
    const hasNumber = /\d/;
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/;
    const hasNoSpaces = /^\S*$/;

    if (password.length < minLength) {
        throw new Error('Password must be at least 8 characters long');
    }
    if (password.length > maxLength) {
        throw new Error('Your password is too long. Please choose a shorter password');
    }
    if (!hasUppercase.test(password)) {
        throw new Error('Password must contain at least one uppercase letter');
    }
    if (!hasLowercase.test(password)) {
        throw new Error('Password must contain at least one lowercase letter');
    }
    if (!hasNumber.test(password)) {
        throw new Error('Password must contain at least one number');
    }
    if (!hasSpecialChar.test(password)) {
        throw new Error('Password must contain at least one special character');
    }
    if (!hasNoSpaces.test(password)) {
        throw new Error('Password cannot contain spaces');
    }
};

module.exports = {validatePassword};