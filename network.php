<?php
	session_start();
	if($_SESSION['UserID'] == "")
	{
		echo("<script>location.href = '/login.php';</script>");
	}

	if($_SESSION['Status'] != "ADMIN")
	{
		echo("<script>location.href = '/login.php';</script>");
	}	
?>
<!DOCTYPE HTML>
<?php
include('dbConfig.php');
include('ListAudioGain.php')
?>

<html>

<head>
    <title>iView RF Power Monitor</title>
    <meta name="description" content="Professional Audio Streamer" />
    <meta name="keywords" content="Audio Streamer, Music Streamer" />
    <meta http-equiv="content-type" content="text/html; charset=UTF-8" />
    <link rel="stylesheet" type="text/css" href="style.css" title="style" />
    <link rel="stylesheet" type="text/css" href="rf-console.css?v=<?php echo time(); ?>" />
    <script src="jquery.min.js"></script>
    <script type="text/javascript" src="jquery-latest.min.js"></script>
    <script type="text/javascript" src="jquery-ui.js"></script>
    <script type="text/javascript" src="myfunctionNetwork.js?v=<?php echo time(); ?>"></script>
</head>

<body class="rf-console rf-console-config rf-console-network">
    <div id="main">
        <div id="header">
            <div id="logo">
                <div id="logo_text">
                    <h1><a href="index.php"><span class="logo_colour">iView RF Power Monitor</span></a></h1>
                </div>
            </div>
            <div id="menubar">
                <ul id="menu">
                    <li><a href="index.php">HOME</a></li>
                    <li><a href="datalogger.php">LOG</a></li>
                    <li><a href="cal.php?id=1">CAL</a></li>
                    <li><a href="thrulan.php?id=0">Power Sensor</a></li>
                    <li><a href="snmp_update.php">Rx SNMP Info</a></li>
                    <li><a href="role.php?id=0">ROLE</a></li>
                    <li class="selected"><a href="network.php">NETWORK</a></li>
                    <li><a href="wifi.php">WiFi</a></li>
                    <li><a href="update.php">SYSTEM</a></li>
                    <li><a href="logout.php">LOGOUT</a></li>
                    <li><a href="changepass.php">CHANGE PASS.</a></li>
                    <!--
          <li><a href="examples.html">Examples</a></li>
          <li><a href="page.html">A Page</a></li>
          <li><a href="another_page.html">Another Page</a></li>
          <li><a href="contact.html">Contact Us</a></li>
-->
                </ul>
            </div>
        </div>
        <div id="site_content">
            <div class="sidebar">
                <h3 align="left">System</h3>
                <form method="post" action="">
                    <div class="form-group">
                        <div class="sampleselected">
                            <select name="systemcommamd" class="systemselect" id="systemcommamd">
                                <option class='selectedlt' selected value='0'>Select option</option>
                                <option class='selectedlt' value='1'>System Reboot</option>
                                <!--				<option class='selectedlt' value='2'>Shutdown</option>-->
                            </select>
                        </div><br><br>
                        <div class="systemdiv">
                            <button class="button button2" type="submit" id="system" name="system" ;>Apply</button>
                        </div>
                    </div>
                </form>
                <h4 align="left">System Time</h4>
                <div class="form-group">
                    <div class="systemdiv"> <span style="float: left">Local Date </span><br>
                        <input class="form-control" type="text" id="currentDate" name="currentDate" value='' disabled />
                    </div>
                    <div class="systemdiv"> <span style="float: left">Local Time </span><br>
                        <input class="form-control" type="text" id="currentTime" name="currentTime" value='' disabled />
                    </div>
                </div>
                <!--         insert your sidebar items here -->

            </div>
            <div id="network_content">
                <!-- insert the page content here -->
                <h3 align="center">Local Network</h3>
                <?php
		  if(isset($_POST['system'])){    
			  $command = $_POST['systemcommamd'];
			  if ($command == '1'){
				  echo '<script language="javascript">';
				  echo "alert('Syetem will be reboot.')";
				  echo '</script>';
				  system("sudo reboot");
			  }
			  else if ($command == '2'){
				  echo '<script language="javascript">';
				  echo "alert('System shutting down. Goodbye.')";
				  echo '</script>';
//				  system("/etc/init.d/autoplayd stop > /dev/null 2>&1 &");
//				  system("/etc/init.d/streamerd stop > /dev/null 2>&1 &");
				  system("sudo shutdown -h 0");
			  }
		   }
		  ?>
                <div class="form-group">
                    <div class="selected_list">
                        <select name="dhcpmethod" class="systemselect" id="dhcpmethod" onChange="setdhcpmethod()">
                            <?php
				$dhcpmethodID = 0;
				foreach ($dhcpmethod as $row) {
					echo "<option class='selectedlt' value='" . $dhcpmethodID . "'>" . $row . "</option>";
					$dhcpmethodID+=1;
				}
			?>
                        </select>
                    </div>
                    <div id="showIP" style="display:none;">
                        <div class="selected_list" style="visibility:hidden;"> <span style="float: left">IP Address
                            </span><br>
                            <input id="ipaddress" name="ipaddress" class="form-control" type="text"
                                placeholder="IP Address" value='<?php echo $ipaddress; ?>' />
                        </div>

                        <div class="selected_list" style="visibility:hidden;">
                            <span>Subnet Mask</span>
                            <input class="form-control" type="text" id="subnet" name="subnet" placeholder="Subnet Mask"
                                value='<?php echo $subnet; ?>' />
                        </div>

                        <div class="selected_list"> <span>Gateway</span>
                            <input class="form-control" type="text" id="gateway" name="gateway" placeholder="Gateway"
                                value='<?php echo $gateway; ?>' />
                        </div>
                        <div class="selected_list"> <span>Primary DNS</span>
                            <input class="form-control" type="text" id="pridns" name="pridns" placeholder="Primary DNS"
                                value='<?php echo $pridns; ?>' />
                        </div>
                        <div class="selected_list"> <span>Secondary DNS</span>
                            <input class="form-control" type="text" id="secdns" name="secdns"
                                placeholder="Secondary DNS" value='<?php echo $secdns; ?>' />
                        </div>
                    </div>
                </div>
                <div class="selected_list"><span></span>
                    <button class="button button2" type="button" id="update" name="update"
                        onClick="updateNetwork()">Apply</button>
                </div>
                <div class="selected_list"><span></span>
                    <button class="button button2" type="button" id="restartnetwork" name="restartnetwork"
                        onClick="restartnetwork()">Networking Restart</button>
                </div>

                <hr>
                <h3 align="center">Wi-Fi (Client) Network</h3>

                <div class="form-group">
                    <div class="selected_list">
                        <select name="wifi_dhcpmethod" class="systemselect" id="wifi_dhcpmethod"
                            onChange="setWifiMethod()">

                            <option class="selectedlt" value="0">Static</option>
                            <option class="selectedlt" value="1" selected>Automatic</option>
                        </select>
                    </div>

                    <div id="wifi_showIP" style="display:none;">
                        <div class="selected_list" style="visibility:visible">
                            <span style="float:left">IP Address</span><br>
                            <input id="wifi_ipaddress" name="wifi_ipaddress" class="form-control" type="text"
                                placeholder="IP Address" value="" />
                        </div>

                        <div class="selected_list" style="visibility:visible">
                            <span>Subnet Mask</span>
                            <input class="form-control" type="text" id="wifi_subnet" name="wifi_subnet"
                                placeholder="255.255.255.0" value="" />
                        </div>

                        <div class="selected_list">
                            <span>Gateway</span>
                            <input class="form-control" type="text" id="wifi_gateway" name="wifi_gateway"
                                placeholder="Gateway" value="" />
                        </div>

                        <div class="selected_list">
                            <span>Primary DNS</span>
                            <input class="form-control" type="text" id="wifi_pridns" name="wifi_pridns"
                                placeholder="1.1.1.1" value="" />
                        </div>

                        <div class="selected_list">
                            <span>Secondary DNS</span>
                            <input class="form-control" type="text" id="wifi_secdns" name="wifi_secdns"
                                placeholder="8.8.8.8" value="" />
                        </div>
                    </div>
                </div>

                <div class="selected_list"><span></span>
                    <button class="button button2" type="button" id="wifi_apply" onClick="wifiApply()">Apply
                        (Wi-Fi)</button>
                </div>

                <hr>
                <h3 align="center">Hotspot (AP) Network</h3>

                <div class="form-group">
                    <div class="selected_list">
                        <select name="ap_dhcpmethod" class="systemselect" id="ap_dhcpmethod"
                            onChange="setHotspotMethod()">
                            <option class="selectedlt" value="static">Static</option>
                        </select>
                    </div>

					<div class="selected_list">
                        <span>SSID</span>
                        <input class="form-control" type="text" id="ssid_hotspot" name="ssid_hotspot" placeholder="*****"/>
                    </div>

                    <div class="selected_list">
                        <span>PASSWORD</span>
                        <input class="form-control" type="text" id="password_hotspot" name="password_hotspot" placeholder="*****"/>
                    </div>

                    <div class="selected_list" style="display:none;">
                        <span>SSID</span>
                        <input class="form-control" type="text" id="ap_pridns" name="ap_pridns" placeholder="1.1.1.1"/>
                    </div>

                    <div class="selected_list" style="display:none;">
                        <span>PASSWORD</span>
                        <input class="form-control" type="text" id="ap_secdns" name="ap_secdns" placeholder="8.8.8.8"/>
                    </div>


                    <div id="ap_showIP" style="display:block;">
                        <div class="selected_list">
                            <span style="float:left">IP Address</span><br>
                            <input id="ap_ipaddress" name="ap_ipaddress" class="form-control" type="text"
                                placeholder="e.g. 192.168.50.1" />
                        </div>

                        <div class="selected_list">
                            <span>Subnet Mask</span>
                            <input class="form-control" type="text" id="ap_subnet" name="ap_subnet"
                                placeholder="255.255.255.0"/>
                        </div>

                        <div class="selected_list">
                            <span>Gateway</span>
                            <input class="form-control" type="text" id="ap_gateway" name="ap_gateway"
                                placeholder="(use AP IP, e.g. 192.168.50.1)"/>
                        </div>
                    </div>
                </div>

                <div class="selected_list"><span></span>
                    <button class="button button2" type="button" id="ap_apply" onClick="hotspotApply()">Apply
                        (Hotspot)</button>
                </div>
<!-- 
				<div id="footer">
                    <h4>IFZ TECHNOLOGIES CO.,LTD. 36/58-59, KHLONG SONG TON NUN, LAT KRABANG, BANGKOK 10520 TEL
                        021717257.
                    </h4>
                </div> -->
                <!-- <p></p> -->
                <!-- <div class="selected_list" style="display: show"> <span>NTP Server1</span>
			<input class="form-control" type="text" id="ntpserver" name="ntpserver"  placeholder="0.th.pool.ntp.org" value=''/>			
	    </div>
		<div class="selected_list" style="display: show"> <span>NTP Server2</span>
			<input class="form-control" type="text" id="ntpserver1" name="ntpserver1"  placeholder="1.th.pool.ntp.org" value=''/>			
	    </div>
		<div class="selected_list" style="display: show"> <span>NTP Server3</span>
			<input class="form-control" type="text" id="ntpserver2" name="ntpserver2"  placeholder="2.th.pool.ntp.org" value=''/>			
	    </div>
		<div class="selected_list" style="display: show"> <span>NTP Server4</span>
			<input class="form-control" type="text" id="ntpserver3" name="ntpserver3"  placeholder="3.th.pool.ntp.org" value=''/>			
	    </div>
		  <div class="selected_list" style="display: show"><span></span>
			<button class="button button2" type="submit" id="update" name="update"  onClick="updateNTPServer()">Update NTP Server</button>
		</div>
		</div> -->

                <!--
	<div class="sidebar2">

    </div>
-->

                <!-- </div> -->
            </div>
        </div>
    </div>

</body>

</html>
