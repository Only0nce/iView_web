<html>
<head>
	<link rel="stylesheet" type="text/css" href="style.css" title="style" />
	<link rel="stylesheet" type="text/css" href="rf-console.css?v=<?php echo time(); ?>" />
<title>iView</title>
</head>
<body class="rf-console rf-console-auth rf-console-login">

<div class="login-page">
  <div class="form">
<!--
    <form class="register-form">
      <input type="text" placeholder="name"/>
      <input type="password" placeholder="password"/>
      <input type="text" placeholder="email address"/>
      <button>create</button>
      <p class="message">Already registered? <a href="#">Sign In</a></p>
    </form>
-->
    <form class="login-form" name="form1" method="post" action="check_login.php">
	  <div class="form-group">
	  <input type="text" id="username" name="username"  class="form-control" placeholder="" required>
	  <label for="username">Username</label>
	  </div>
	  <div class="form-group">
	  <input type="password" id="password" name="password"  class="form-control" placeholder="" required>
	  <label for="password">Password</label>
	  </div>
	  <button class="button button2" type="submit"  name="Submit">LOGIN</button>
<!--      <button>login</button>-->
<!--      <p class="message">Not registered? <a href="#">Create an account</a></p>-->
    </form>
  </div>
</div>
	<div id="footer">
      <h4>IFZ TECHNOLOGIES CO.,LTD. 36/58-59, KHLONG SONG TON NUN, LAT KRABANG, BANGKOK 10520 TEL 021717257.</h4>
</div>
</body>
</html>
