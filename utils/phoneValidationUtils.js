function isValidUSPhoneNumber(phoneNumber) {
    const phoneRegex = /^(?:\+1)?\(?([2-9][0-8][0-9])\)?[-.●]?([2-9][0-9]{2})[-.●]?([0-9]{4})$/;
    return phoneRegex.test(phoneNumber);
}

module.exports = {
    isValidUSPhoneNumber
};