package cl.tufarmacia.app.ui

import android.annotation.SuppressLint
import android.app.Activity
import android.os.Bundle
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import cl.tufarmacia.app.ui.theme.TuFarmaciaTheme

/**
 * Loads Transbank Webpay Plus by auto-submitting token_ws (same as web checkout).
 * Detects return to /checkout/webpay/success|error and finishes with RESULT_OK/CANCELED.
 */
class WebpayActivity : ComponentActivity() {
    @OptIn(ExperimentalMaterial3Api::class)
    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val url = intent.getStringExtra(EXTRA_URL).orEmpty()
        val token = intent.getStringExtra(EXTRA_TOKEN).orEmpty()
        if (url.isBlank() || token.isBlank()) {
            setResult(Activity.RESULT_CANCELED)
            finish()
            return
        }
        val html = """
            <!DOCTYPE html><html><body onload="document.forms[0].submit()">
            <p>Redirigiendo a Webpay…</p>
            <form method="post" action="${escape(url)}">
              <input type="hidden" name="token_ws" value="${escape(token)}" />
            </form>
            </body></html>
        """.trimIndent()

        setContent {
            TuFarmaciaTheme {
                Scaffold(
                    topBar = {
                        TopAppBar(
                            title = { Text("Pago Webpay") },
                            navigationIcon = {
                                IconButton(onClick = {
                                    setResult(Activity.RESULT_CANCELED)
                                    finish()
                                }) {
                                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Cerrar")
                                }
                            },
                        )
                    },
                ) { padding ->
                    AndroidView(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(padding),
                        factory = { ctx ->
                            WebView(ctx).apply {
                                settings.javaScriptEnabled = true
                                settings.domStorageEnabled = true
                                webViewClient = object : WebViewClient() {
                                    override fun shouldOverrideUrlLoading(
                                        view: WebView?,
                                        request: WebResourceRequest?,
                                    ): Boolean {
                                        val u = request?.url?.toString().orEmpty()
                                        return handleReturnUrl(u)
                                    }

                                    @Deprecated("Deprecated in Java")
                                    override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                                        return handleReturnUrl(url.orEmpty())
                                    }

                                    override fun onPageFinished(view: WebView?, url: String?) {
                                        super.onPageFinished(view, url)
                                        handleReturnUrl(url.orEmpty())
                                    }
                                }
                                loadDataWithBaseURL(url, html, "text/html", "UTF-8", null)
                            }
                        },
                    )
                }
            }
        }
    }

    private fun handleReturnUrl(u: String): Boolean {
        if (u.contains("/checkout/webpay/success")) {
            setResult(Activity.RESULT_OK)
            finish()
            return true
        }
        if (u.contains("/checkout/webpay/error")) {
            setResult(Activity.RESULT_CANCELED)
            finish()
            return true
        }
        return false
    }

    private fun escape(s: String): String =
        s.replace("&", "&amp;").replace("\"", "&quot;").replace("<", "&lt;")

    companion object {
        const val EXTRA_URL = "url"
        const val EXTRA_TOKEN = "token"
    }
}
