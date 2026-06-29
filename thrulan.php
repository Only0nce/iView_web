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
	require_once __DIR__ . '/hardware_features.php';
?>
<!DOCTYPE HTML>
<?php
include('dbConfig.php');
include('ListAudioGain.php')

?>
<html>

<head>
    <title>iView</title>
    <meta name="description" content="4 Wire to ED-137 Converter" />
    <meta name="keywords" content="ED137, SIP" />
    <meta http-equiv="content-type" content="text/html; charset=UTF-8" />
    <link rel="stylesheet" type="text/css" href="style.css" title="style" />
    <link rel="icon" type="image/png" href="favicon.ico" sizes="16x16" />
    <script src="jquery.min.js"></script>
    <script type="text/javascript" src="jquery-latest.min.js"></script>
    <script type="text/javascript" src="jquery-ui.js"></script>
    <script type="text/javascript" src="thrulan.js?v=<?php echo time(); ?>"></script>
    <!--  <script type="text/javascript" src="countUp.js"></script>-->

    <script type="text/javascript">

    </script>

    <style>
    /* CSS — วางต่อท้ายไฟล์ เพื่อให้ชนะ style.css เดิม */
    .switch {
        position: relative;
        display: inline-block;
        width: 60px;
        /* ปรับขนาดได้ */
        height: 34px;
        vertical-align: middle;
    }

    .switch input {
        position: absolute;
        opacity: 0;
        /* ซ่อน input แต่ยังคลิกได้เพราะ label ครอบ */
        width: 0;
        height: 0;
        margin: 0;
    }

    .slider {
        position: absolute;
        inset: 0;
        /* top:0; right:0; bottom:0; left:0; */
        background-color: #ccc;
        border-radius: 34px;
        width: 100%;
        height: 35px;
        cursor: pointer;
        transition: background-color .2s ease, box-shadow .2s ease;
    }

    .slider:before {
        content: "";
        position: absolute;
        height: 26px;
        /* = height - 8 */
        width: 26px;
        left: 4px;
        bottom: 4px;
        background-color: #fff;
        border-radius: 50%;
        transition: transform .2s ease;
    }

    /* สถานะเปิด */
    .switch input:checked+.slider {
        background-color: #2196F3;
    }

    /* โฟกัสแสดงเงา */
    .switch input:focus+.slider {
        box-shadow: 0 0 0 3px rgba(33, 150, 243, .35);
    }

    /* เม็ดกลมเลื่อนไปขวาเมื่อ checked */
    .switch input:checked+.slider:before {
        transform: translateX(26px);
        /* = width - height +  (height - knob) - 2*padding */
    }

    /* เฉพาะทรงกลม (ให้คงไว้นะ) */
    .slider.round {
        border-radius: 34px;
    }

    .slider.round:before {
        border-radius: 50%;
    }


    .dropbtn {
        background-color: #04AA6D;
        color: white;
        padding: 16px;
        font-size: 13px;
        width: 100%;
        height: 31px;
        border: none;
        cursor: pointer;
        line-height: 20px;
        /* ทำให้ข้อความกึ่งกลางแนวตั้ง */
        border: none;
        text-align: center;
        /* จัดกึ่งกลางแนวนอน */
        padding: 0;
        /* ไม่ต้องมี padding */
        border-radius: 15px;
    }

    .dropbtn::after {
        content: " ▼";
        /* Unicode ลูกศรลง */
        font-size: 12px;
        /* ปรับขนาดลูกศร */
        margin-left: 10px;
        margin-top: 5px;
        /* ระยะห่างจากข้อความ */
    }

    .dropbtn:hover,
    .dropbtn:focus {
        background-color: rgb(4, 170, 46);
    }

    .dropdown {
        position: relative;
        display: inline-block;
        width: 100%;
        /* 👈 กำหนดความกว้างที่ต้องการ */
        margin: 0px 0px 10px 0px;
    }

    .dropdown-content {
        display: none;
        position: absolute;
        background-color: #f1f1f1;
        min-width: 100%;
        /* 👈 ให้กว้างเท่ากับปุ่ม */
        min-height: 20px;
        /* 👈 ให้กว้างเท่ากับปุ่ม */
        box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);
        z-index: 1;
    }

    .dropdown-content a {
        color: black;
        padding: 12px 16px;
        text-decoration: none;
        display: block;
    }

    .dropdown a:hover {
        background-color: #ddd;
    }

    .show {
        display: block;
    }
    </style>

</head>

<body>
    <div id="header">
        <div id="logo">
            <div id="logo_text">
                <h1><a href="index.php"><span class="logo_colour">RF Power Sensor Monitoring System</span></a></h1>
            </div>
        </div>
        <!--
  <div class="showHeaderDiv">
  	<h1 class="text-align-center">UHF Multi-coupler </h1>
  </div>
-->
        <div id="menubar">
            <ul id="menu">
                <li><a href="index.php">HOME</a></li>
                <li><a href="datalogger.php">LOG</a></li>
                <li><a href="cal.php?id=1">CAL</a></li>
                <li class="selected"><a href="thrulan.php?id=0">Power Sensor</a></li>
                <li><a href="snmp_update.php">Rx SNMP Info</a></li>
                <li><a href="role.php?id=0">ROLE</a></li>
                <li><a href="network.php">NETWORK</a></li>
                <?php echo iview_render_wifi_menu_item(false); ?>
<li><a href="update.php">System</a></li>
                <li><a href="logout.php">LOGOUT</a></li>
                <li><a href="changepass.php">CHANGE PASS.</a></li>
            </ul>
        </div>
    </div>
    <div id="site_content">

        <?php			
	if(isset($_GET['id']))
		$newid = $_GET['id'];
	if(isset($_POST['id']))
		$newid = $_POST['id'];

	if(isset($_POST['system']))
	{    
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
		  system("sudo shutdown -h 0");
	  }
	  else if ($command == '3'){
		  echo '<script language="javascript">';
		  echo "alert('Restart ED-137 Converter Service')";
		  echo '</script>';
		  system("sudo /etc/init.d/ed137converterd stop > /dev/null 2>&1 &");
	  }
	}
	if ($newid != 0)
	{
			echo '<script language="javascript">';
		  echo 'setCurrentID('.$newid.')';
		  echo '</script>';
	}
	?>


        <div class="container">
            <h3 class="truelanLabel" id="newtruelan" name="newtruelan">New Power Sensor</h3>
        </div>
        <div class="container6">
            <div class="card" id="card0" name="card0" style="display: block; background-color: rgba(0, 0, 0, 0.0)">
                <?php	
				
				echo '<div class="cardTxTab" id="cardTxId0" name="cardTxId0" onclick="setCurrentID(0)" style="display: block; background-color:rgba(0,0,0,0.3)">';
				echo '<img class="cardTxTabImage" src="img/newRadio.png" alt="Flowers in Chania">';
				echo '<span class="cardTxTabText3" id="cardNameId0" name="cardNameId0"> New </span>';
				echo '</div>';
			?>
            </div>
        </div>


        <div class="container7">
            <div class="card" id="card" name="card"
                style="width:50%; display: block; background-color: rgba(0, 0, 0, 0.0);">
                <div class="selected_list" style="display: show"> <span>Power Sensor Name</span>
                    <input class="form-control" type="text" id="deviceName" name="deviceName"
                        placeholder="Power Sensor Name" />
                </div>
                <div class="selected_list" style.visibility="hidden"> <span style="float: left">Power Sensor IP
                        Address</span><br>
                    <input id="ipaddress" name="ipaddress" class="form-control" type="text" placeholder="IP Address"
                        value='<?php echo $ipaddress; ?>' />
                </div>
                <div class="selected_list" style="display: show"> <span>Power Sensor Frequency</span>
                    <input class="form-control" type="number" min="10000000" max="3000000000" step="10000"
                        id="deviceFrequency" name="deviceFrequency" placeholder="Device Frequency" value='' />
                </div>
                <div class="selected_list" style="display: show"> <span>Max Power</span>
                    <input class="form-control" type="number" min="1" max="10000" step="10" id="peakPower"
                        name="peakPower" placeholder="Max Power" value=0 />
                </div>
                <div class="selected_list" style="display: show"> <span>Warning Power</span>
                    <input class="form-control" type="number" min="1" max="10000" step="1" id="warningFwdPowerWatt"
                        name="peakPower" placeholder="Warning Power" value=0 />
                </div>
                <div class="selected_list" style="display: show"> <span>Alert Power</span>
                    <input class="form-control" type="number" min="1" max="10000" step="1" id="alertFwdPowerWatt"
                        name="peakPower" placeholder="Alert Power" value=0 />
                </div>

                <div class="selected_list" style="display: show"> <span>Warning VSWR</span>
                    <input class="form-control" type="number" min="1.1" max="2.0" step="0.1" id="warningVSWR"
                        name="peakPower" placeholder="Warning VSWR" value=1.1 />
                </div>
                <div class="selected_list" style="display: show"> <span>Alert VSWR</span>
                    <input class="form-control" type="number" min="1.1" max="2.0" step="0.1" id="alertVSWR"
                        name="peakPower" placeholder="Alert VSWR" value=1.1 />
                </div>
                <div class="selected_list" style="display: show; width:200%;"><span></span>
                    <button class="button button2" id="newtruelanbutton" onClick="updateTrueLan()">NEW</button>
                </div>
                <div class="selected_list" style="display: show; width:200%;"><span></span>
                    <button class="button button2" id="deletetruelanbutton" onClick="deleteTrueLan()"
                        style="display: none; background-color: #ff2222aa; ">REMOVE</button>
                </div>
            </div>

            <div class="card" id="card" name="card"
                style="width:50%; display: block; background-color: rgba(0, 0, 0, 0.0);">
                <div class="selected_list" style="display: show"> <span>Receiver Name</span> </div>
                <div class="dropdown">
                    <button onclick="myFunction()" class="dropbtn" id="dropdown-oid-btn">Select Device </button>
                    <div class="dropdown-content" id="dropdown-oid">
                        <!-- รายการ OID จะถูกเติมเป็น <a> โดย JS -->
                    </div>
                </div>
                <!-- <br><br><br><br><br> -->
                <div class="selected_list" style.visibility="hidden"> <span style="float: left">Receiver IP Address
                    </span><br>
                    <input id="receive_ipaddress" name="ipaddress" class="form-control" type="text"
                        placeholder="IP Address" value='<?php echo $ipaddress; ?>' />
                </div>
                <div class="selected_list" style="display: show"> <span>Warning RSSI</span>
                    <input class="form-control" type="number" min="-10000" max="10000" step="1" id="warningRssi"
                        name="peakPower" placeholder="Warning RSSI" value=-90 />
                </div>
                <div class="selected_list" style="display: show"> <span>Alert RSSI</span>
                    <input class="form-control" type="number" min="-10000" max="10000" step="1" id="alertRssi"
                        name="peakPower" placeholder="Alert RSSI" value=-90 />
                </div>
                <label class="switch">
                    <input type="checkbox" id="rxEnabled">
                    <span class="slider round"></span>
                </label>
                <span id="rxEnabledStateLabel">SNMP Disable</span>
                <!-- <div class="selected_list" style="display: show"><span></span>
                    <button class="button button2" id="newtruelanbutton" onClick="updateTrueLan()">NEW</button>
                </div>
                <div class="selected_list" style="display: show"><span></span>
                    <button class="button button2" id="deletetruelanbutton" onClick="deleteTrueLan()"
                        style="display: none; background-color: #ff2222aa; ">REMOVE</button>
                </div> -->
            </div>
        </div>



    </div>


</body>

</html>
