<?php
/**
 * iView web hardware profile.
 *
 * Keep this file aligned with the Qt/QML build profile:
 *   qmake RFPowerMonitors.pro                  -> all false / Ethernet-only
 *   qmake RFPowerMonitors.pro CONFIG+=HW_WIFI  -> WiFi + Hotspot true
 *   qmake RFPowerMonitors.pro CONFIG+=HW_5G    -> cellular5g true
 *
 * Change these values per hardware model before deployment.
 */

define('IVIEW_HAS_WIFI', false);
define('IVIEW_HAS_HOTSPOT', IVIEW_HAS_WIFI);
define('IVIEW_HAS_5G', false);
