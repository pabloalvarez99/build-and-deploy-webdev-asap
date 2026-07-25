package cl.tufarmacia.app.util

object ChileValidation {
    private val emailRegex = Regex("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")

    fun isValidEmail(email: String): Boolean =
        email.isNotBlank() && emailRegex.matches(email.trim())

    /** Chilean phone: 8–11 digits after stripping (allows +56 / 56 prefix). */
    fun isValidPhone(phone: String): Boolean {
        var digits = phone.filter { it.isDigit() }
        if (digits.startsWith("56") && digits.length >= 10) {
            digits = digits.removePrefix("56")
        }
        return digits.length in 8..9
    }

    fun isValidName(name: String): Boolean = name.trim().length >= 2
}
