package cl.tufarmacia.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import cl.tufarmacia.app.ui.TuFarmaciaRoot
import cl.tufarmacia.app.ui.theme.TuFarmaciaTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val container = (application as TuFarmaciaApp).container
        setContent {
            // Outer theme for splash; TuFarmaciaRoot re-applies with user prefs
            TuFarmaciaTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    TuFarmaciaRoot(container = container)
                }
            }
        }
    }
}
