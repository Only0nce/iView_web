<?php
/**
 * Central hardware feature flags for the iView PHP frontend.
 *
 * PHP is not compiled by qmake, so it cannot read .pro DEFINES directly.
 * Keep hardware_profile.php synchronized with the Qt build profile.
 */

$iviewHardwareProfile = __DIR__ . '/hardware_profile.php';
if (is_file($iviewHardwareProfile)) {
    require_once $iviewHardwareProfile;
}

if (!defined('IVIEW_HAS_WIFI')) {
    define('IVIEW_HAS_WIFI', false);
}

if (!defined('IVIEW_HAS_HOTSPOT')) {
    define('IVIEW_HAS_HOTSPOT', IVIEW_HAS_WIFI);
}

if (!defined('IVIEW_HAS_5G')) {
    define('IVIEW_HAS_5G', false);
}

function iview_has_wifi()
{
    return defined('IVIEW_HAS_WIFI') && IVIEW_HAS_WIFI;
}

function iview_has_hotspot()
{
    return defined('IVIEW_HAS_HOTSPOT') && IVIEW_HAS_HOTSPOT;
}

function iview_has_5g()
{
    return defined('IVIEW_HAS_5G') && IVIEW_HAS_5G;
}

function iview_feature_array()
{
    return [
        'wifi' => iview_has_wifi(),
        'hotspot' => iview_has_hotspot(),
        'cellular5g' => iview_has_5g(),
    ];
}

function iview_feature_json()
{
    return json_encode(iview_feature_array(), JSON_UNESCAPED_SLASHES);
}

function iview_print_feature_script()
{
    echo '<script>window.iviewFeatures = ' . iview_feature_json() . ';</script>' . "\n";
}

function iview_render_wifi_menu_item($selected = false)
{
    if (!iview_has_wifi()) {
        return '';
    }

    $class = $selected ? ' class="selected"' : '';
    return '<li' . $class . '><a href="wifi.php">WiFi</a></li>' . "\n";
}

function iview_render_5g_menu_item($selected = false)
{
    if (!iview_has_5g()) {
        return '';
    }

    // Placeholder for future cellular.php page. Do not render until the page exists.
    return '';
}

function iview_ensure_wifi_or_redirect($redirectTo = 'network.php?feature=wifi_disabled')
{
    if (iview_has_wifi()) {
        return;
    }

    header('Location: ' . $redirectTo);
    exit;
}
