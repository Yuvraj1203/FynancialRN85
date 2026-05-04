package com.fynancialapp

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.fynancialapp.BuildConfig
import android.os.Bundle
import com.swmansion.rnscreens.fragment.restoration.RNScreensFragmentFactory

import android.view.View
import android.view.ViewGroup
import androidx.core.graphics.Insets
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.updatePadding
import android.view.WindowManager


class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = BuildConfig.app_name

  override fun onCreate(savedInstanceState: Bundle?) {
    supportFragmentManager.fragmentFactory = RNScreensFragmentFactory()
    super.onCreate(savedInstanceState)


     // This code handles window insets to ensure the app's content
        // does not overlap with system bars and, specifically, the keyboard.
        // This is the native fix for KeyboardAvoidingView issues on Android 15.
        val rootView: View = findViewById(android.R.id.content)
        ViewCompat.setOnApplyWindowInsetsListener(rootView) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            val ime = insets.getInsets(WindowInsetsCompat.Type.ime())
            
            // Apply padding to the root view to accommodate the system bars and keyboard.
            // This prevents content from being hidden by the keyboard.
            v.updatePadding(
                left = systemBars.left,
                right = systemBars.right,
                bottom = ime.bottom
            )
            
            // Consume the insets to prevent them from being passed to other views.
            WindowInsetsCompat.CONSUMED
        }    
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
          setRecentsScreenshotEnabled(false)   // blocks Recents thumbnail on API 33+
        } 
  }

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)


  //**for no display on minimize */
  override fun onPause() {
    super.onPause()
    // Set BEFORE app goes to background; older Android/OEMs snapshot around onPause
    window.setFlags(
      WindowManager.LayoutParams.FLAG_SECURE,
      WindowManager.LayoutParams.FLAG_SECURE
    )
  }
 
  override fun onResume() {
    super.onResume()
    // Clear only if you want screenshots allowed while app is active
    window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
  }
}
