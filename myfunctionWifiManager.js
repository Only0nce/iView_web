(() => {
  const WS_PORT_WIFI = 3279;
  const WS_PORT_HOTSPOT = 3278;
  const RECONNECT_MS = 3000;
  const BANNER_HIDE_MS = 8000;
  const IVIEW_FEATURES = window.iviewFeatures || {};
  const HAS_WIFI = !!IVIEW_FEATURES.wifi;
  const HAS_HOTSPOT = !!IVIEW_FEATURES.hotspot;
  const HAS_5G = !!IVIEW_FEATURES.cellular5g;
  let refs = {};

  let wsWifi = null;
  let wsHotspot = null;
  let reconnectWifiTimer = null;
  let reconnectHotspotTimer = null;
  let bannerTimer = null;
  let wifiEnabled = false;
  let hotspotEnabled = false;
  let hotspotToggleInFlight = false;
  let hotspotToggleTarget = null;
  let hotspotToggleTimer = null;
  let hotspotSsid = '';
  let currentSsid = '';
  let phyNetworkName = 'wlan0';
  let networks = [];
  let pendingScanSize = 0;
  let initialized = false;

  function cacheRefs() {
    refs = {
      banner: document.getElementById('wifiBanner'),
      netList: document.getElementById('netList'),
      reloadBtn: document.getElementById('wifiReloadBtn'),
      toggleBtn: document.getElementById('wifiToggleBtn'),
      statusBadge: document.getElementById('wifiStatusBadge'),
      currentLabel: document.getElementById('wifiCurrentNetworkLabel'),
      deviceLabel: document.getElementById('wifiDeviceLabel'),
      ipLabel: document.getElementById('wifiIpLabel'),
      gatewayLabel: document.getElementById('wifiGatewayLabel'),
      netmaskLabel: document.getElementById('wifiNetmaskLabel'),
      summary: document.getElementById('wifiNetworkSummary'),
      hotspotStatusBadge: document.getElementById('hotspotStatusBadge'),
      hotspotCurrentSsid: document.getElementById('hotspotCurrentSsid'),
      hotspotIpLabel: document.getElementById('hotspotIpLabel'),
      hotspotGatewayLabel: document.getElementById('hotspotGatewayLabel'),
      hotspotNetmaskLabel: document.getElementById('hotspotNetmaskLabel'),
      hotspotToggleBtn: document.getElementById('hotspotToggleBtn'),

      modalOverlay: document.getElementById('wifiModalOverlay'),
      modalTitle: document.getElementById('wifiModalTitle'),
      modalClose: document.getElementById('wifiModalClose'),
      modalCancel: document.getElementById('wifiModalCancel'),
      modalError: document.getElementById('wifiModalError'),
      passwordInput: document.getElementById('wifiPasswordInput'),
      showPassword: document.getElementById('wifiShowPassword'),
      joinBtn: document.getElementById('wifiJoinBtn'),

      advOverlay: document.getElementById('wifiAdvOverlay'),
      advSub: document.getElementById('wifiAdvSub'),
      advClose: document.getElementById('wifiAdvClose'),
      advCancel: document.getElementById('wifiAdvCancel'),
      advDisconnect: document.getElementById('wifiAdvDisconnect'),
      advSave: document.getElementById('wifiAdvSave'),
      addrIp: document.getElementById('addrIp'),
      addrMask: document.getElementById('addrMask'),
      addrGw: document.getElementById('addrGw'),
      addrDel: document.getElementById('addrDel'),
      currentIpLabel: document.getElementById('currentIpLabel'),
      dnsAutoToggle: document.getElementById('dnsAutoToggle'),
      dnsInput: document.getElementById('dnsInput')
    };
  }

  function wsUrl(port) {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname || '127.0.0.1';
    return `${proto}//${host}:${port}`;
  }

  function setValue(el, value, fallback = '—') {
    if (!el) return;
    const text = String(value == null ? '' : value).trim();
    el.textContent = text || fallback;
  }

  function normalizeIpv4(value) {
    const raw = String(value || '').trim();
    if (!raw) return '—';
    return raw.includes('/') ? raw.split('/')[0].trim() || '—' : raw;
  }

  function firstDefined(obj, keys) {
    if (!obj || !Array.isArray(keys)) return undefined;
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] != null) {
        return obj[key];
      }
    }
    return undefined;
  }

  function parseBoolLike(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;

    const raw = String(value == null ? '' : value).trim().toLowerCase();
    if (!raw) return null;
    if (/^-?\d+$/.test(raw)) return Number(raw) !== 0;
    if (/^(shared|static|manual|auto|dhcp)$/i.test(raw)) return true;
    if (/^(true|on|enable|enabled|active|up|running|started|start)$/i.test(raw)) return true;
    if (/^(false|off|disable|disabled|inactive|down|stopped|stop)$/i.test(raw)) return false;
    return null;
  }

  function escHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function showBanner(message = '', tone = 'info') {
    if (!refs.banner) return;
    if (bannerTimer) {
      clearTimeout(bannerTimer);
      bannerTimer = null;
    }
    if (!message) {
      refs.banner.className = 'wifi-banner wifi-banner-hidden';
      refs.banner.textContent = '';
      return;
    }
    refs.banner.className = `wifi-banner wifi-banner-${tone}`;
    refs.banner.textContent = message;
    bannerTimer = setTimeout(() => {
      refs.banner.className = 'wifi-banner wifi-banner-hidden';
      refs.banner.textContent = '';
      bannerTimer = null;
    }, BANNER_HIDE_MS);
  }

  function renderEmptyState(title, subtitle) {
    if (!refs.netList) return;
    refs.netList.innerHTML = `
      <div class="wifi-empty-state">
        <h5>${escHtml(title)}</h5>
        <p>${escHtml(subtitle || '')}</p>
      </div>`;
  }

  function setNetworkSummary(total = 0, extra = '') {
    if (!refs.summary) return;
    const count = Number(total) || 0;
    const base = count > 0 ? `${count} networks found` : '0 networks';
    refs.summary.textContent = extra ? `${base} · ${extra}` : base;
  }

  function setStatus(connected) {
    if (refs.statusBadge) {
      refs.statusBadge.textContent = connected ? 'Connected' : 'Disconnected';
      refs.statusBadge.className = connected ? 'wifi-badge wifi-badge-on' : 'wifi-badge wifi-badge-off';
    }
    if (refs.toggleBtn) {
      refs.toggleBtn.textContent = wifiEnabled ? 'Turn Wi‑Fi Off' : 'Turn Wi‑Fi On';
    }
  }

  function setHotspotStatus(enabled) {
    hotspotEnabled = !!enabled;
    hotspotToggleInFlight = false;
    hotspotToggleTarget = null;
    clearHotspotToggleTimer();
    if (refs.hotspotStatusBadge) {
      refs.hotspotStatusBadge.textContent = hotspotEnabled ? 'Enabled' : 'Disabled';
      refs.hotspotStatusBadge.className = hotspotEnabled ? 'wifi-badge wifi-badge-hotspot-on' : 'wifi-badge wifi-badge-off';
    }
    updateHotspotToggleButton();
  }

  function clearHotspotToggleTimer() {
    if (hotspotToggleTimer) {
      clearTimeout(hotspotToggleTimer);
      hotspotToggleTimer = null;
    }
  }

  function updateHotspotToggleButton() {
    if (!refs.hotspotToggleBtn) return;

    const socketReady = !!(wsHotspot && wsHotspot.readyState === WebSocket.OPEN);
    refs.hotspotToggleBtn.disabled = !socketReady || hotspotToggleInFlight;

    if (hotspotToggleInFlight) {
      refs.hotspotToggleBtn.textContent = hotspotToggleTarget ? 'Turning Hotspot On...' : 'Turning Hotspot Off...';
      return;
    }

    refs.hotspotToggleBtn.textContent = hotspotEnabled ? 'Turn Hotspot Off' : 'Turn Hotspot On';
  }

  function getCurrentHotspotState() {
    const badgeState = parseBoolLike(refs.hotspotStatusBadge ? refs.hotspotStatusBadge.textContent : '');
    if (badgeState !== null) return badgeState;
    return !!hotspotEnabled;
  }

  function markHotspotTogglePending(targetState) {
    hotspotToggleInFlight = true;
    hotspotToggleTarget = !!targetState;
    clearHotspotToggleTimer();
    hotspotToggleTimer = setTimeout(() => {
      hotspotToggleInFlight = false;
      hotspotToggleTarget = null;
      hotspotToggleTimer = null;
      updateHotspotToggleButton();
      showBanner('Hotspot state update timeout. Please try again.', 'warning');
    }, 8000);
    updateHotspotToggleButton();
  }

  function settleHotspotToggleOnSocketClose() {
    // Some backends close the hotspot socket immediately after off command.
    if (hotspotToggleInFlight && hotspotToggleTarget === false) {
      setHotspotStatus(false);
      showBanner('Hotspot turned off.', 'success');
      return true;
    }
    return false;
  }

  function toggleHotspot() {
    if (!HAS_HOTSPOT) {
      showBanner('Hotspot is not available on this hardware profile.', 'warning');
      return false;
    }
    if (hotspotToggleInFlight) return false;

    const currentState = getCurrentHotspotState();
    const targetState = !currentState;
    const menuID = targetState ? 'onhotspot' : 'offhotspot';
    const bannerMsg = targetState ? 'Turning Hotspot on...' : 'Turning Hotspot off...';

    // Ensure Wi‑Fi is turned off before toggling hotspot state.
    if (wsWifi && wsWifi.readyState === WebSocket.OPEN) {
      const offWifiPayload = { menuID: 'offwifi' };
      wsWifi.send(JSON.stringify(offWifiPayload));
      console.log('Sent command:', offWifiPayload);
    }

    const ok = sendHotspotCommand(menuID, null, bannerMsg, 'info');
    if (ok) markHotspotTogglePending(targetState);
    return ok;
  }

  function hydrateHotspotSummary(msg = {}) {
    const activeByFlag = parseBoolLike(firstDefined(msg, ['isHotspotActive']));
    if (activeByFlag !== null) {
      setHotspotStatus(activeByFlag);
    } else {
      const enabledRaw = firstDefined(msg, ['hotspotEnabled', 'hotspotEnable', 'enabled', 'enable', 'status', 'state', 'dhcpmethod']);
      const enabled = parseBoolLike(enabledRaw);
      if (enabled !== null) {
        setHotspotStatus(enabled);
      }
    }

    const ssidRaw = firstDefined(msg, ['ssid', 'hotspotSsid', 'ESSID', 'apSsid']);
    if (ssidRaw !== undefined) {
      hotspotSsid = String(ssidRaw || '').trim();
    }
    setValue(refs.hotspotCurrentSsid, hotspotSsid, '—');

    if (Object.prototype.hasOwnProperty.call(msg, 'ipaddress')) {
      setValue(refs.hotspotIpLabel, normalizeIpv4(msg.ipaddress || ''));
    }
    if (Object.prototype.hasOwnProperty.call(msg, 'gateway')) {
      setValue(refs.hotspotGatewayLabel, normalizeIpv4(msg.gateway || ''));
    }
    if (Object.prototype.hasOwnProperty.call(msg, 'subnet')) {
      setValue(refs.hotspotNetmaskLabel, msg.subnet || '—');
    }
  }

  function updateSummaryCard() {
    const active = networks.find((n) => n.connected);
    const activeEssid = active && active.ESSID ? active.ESSID : '';
    currentSsid = activeEssid || currentSsid || '';
    setStatus(!!active && wifiEnabled);
    setValue(refs.currentLabel, activeEssid || currentSsid, '—');
  }

  function formatBand(network) {
    const freq = Number(network.Frequency || 0);
    if (freq >= 4900) return '5 GHz';
    if (freq >= 2400) return '2.4 GHz';
    return network.Frequency ? `${network.Frequency}` : 'Wi‑Fi';
  }

  function buildMeta(network) {
    const parts = [];
    if (network.Address) parts.push(`BSSID ${network.Address}`);
    if (network.Frequency) parts.push(`${network.Frequency}`);
    if (network.BitRates) parts.push(`${network.BitRates}`);
    if (network.Signallevel !== undefined && network.Signallevel !== null && network.Signallevel !== '') {
      parts.push(`Signal ${network.Signallevel}%`);
    }
    return parts.join(' · ');
  }

  function renderNetworks() {
    if (!refs.netList) return;

    const visibleNetworks = networks
      .filter((n) => String(n.ESSID || '').trim() !== '')
      .sort((a, b) => {
        if (!!a.connected !== !!b.connected) return a.connected ? -1 : 1;
        return Number(b.Signallevel || 0) - Number(a.Signallevel || 0);
      });

    const discoveredCount = networks.filter(Boolean).length;
    let summaryExtra = '';
    if (!wifiEnabled) {
      summaryExtra = 'Wi‑Fi off';
    } else if (pendingScanSize > 0 && discoveredCount < pendingScanSize) {
      summaryExtra = `Scanning ${discoveredCount}/${pendingScanSize}`;
    }

    setNetworkSummary(visibleNetworks.length, summaryExtra);

    if (!wifiEnabled) {
      renderEmptyState('Wi‑Fi is Off', 'Turn Wi‑Fi back on to scan and connect to available networks.');
      return;
    }

    if (visibleNetworks.length === 0) {
      renderEmptyState('Scanning networks...', 'Please wait while nearby Wi‑Fi access points are detected.');
      return;
    }

    refs.netList.innerHTML = visibleNetworks.map((network) => {
      const secure = !!network.Encryptionkey;
      const saved = typeof network.password === 'string' && network.password.length > 0;
      const tags = [
        network.connected ? '<span class="wifi-tag wifi-tag-success">Connected</span>' : '',
        saved ? '<span class="wifi-tag wifi-tag-primary">Saved</span>' : '',
        `<span class="wifi-tag wifi-tag-muted">${escHtml(formatBand(network))}</span>`,
        `<span class="wifi-tag wifi-tag-muted">${secure ? 'Secure' : 'Open'}</span>`
      ].filter(Boolean).join('');

      let buttons = '';
      if (network.connected) {
        buttons = `
          <button type="button" class="button button2 js-edit" data-ssid="${escHtml(network.ESSID)}">Advanced</button>
          <button type="button" class="button button2 js-disconnect" data-ssid="${escHtml(network.ESSID)}">Disconnect</button>
          <button type="button" class="button button2 wifi-modal-btn-danger js-forget" data-ssid="${escHtml(network.ESSID)}">Forget</button>`;
      } else if (saved) {
        buttons = `
          <button type="button" class="button button2 js-connect" data-ssid="${escHtml(network.ESSID)}">Connect</button>
          <button type="button" class="button button2 js-edit" data-ssid="${escHtml(network.ESSID)}">Advanced</button>`;
      } else if (secure) {
        buttons = `<button type="button" class="button button2 js-join" data-ssid="${escHtml(network.ESSID)}">Join</button>`;
      } else {
        buttons = `<button type="button" class="button button2 js-connect-open" data-ssid="${escHtml(network.ESSID)}">Connect</button>`;
      }

      return `
        <div class="wifi-network-item ${network.connected ? 'active' : ''}">
          <div class="wifi-network-top">
            <div>
              <div class="wifi-network-name">${escHtml(network.ESSID || '(Hidden SSID)')}</div>
              <div class="wifi-network-meta">${escHtml(buildMeta(network))}</div>
              <div class="wifi-network-tags">${tags}</div>
            </div>
            <div class="wifi-network-actions">${buttons}</div>
          </div>
        </div>`;
    }).join('');
  }

  function sendJson(obj, target = 'wifi') {
    const payload = JSON.stringify(obj);
    const socket = target === 'hotspot' ? wsHotspot : wsWifi;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(payload);
      return true;
    }
    return false;
  }

  function sendCommand(menuID, payload, bannerMessage, tone) {
    if (!HAS_WIFI) {
      showBanner('Wi‑Fi is not available on this hardware profile.', 'warning');
      return false;
    }
    const cmd = String(menuID || '').trim();
    if (!cmd) return false;

    const obj = { menuID: cmd };
    if (payload && typeof payload === 'object') {
      Object.keys(payload).forEach((key) => {
        obj[key] = payload[key];
      });
    }

    const ok = sendJson(obj, 'wifi');
    if (!ok) {
      showBanner('Wi‑Fi backend is not connected yet.', 'warning');
      return false;
    } else {
      console.log('Sent command:', obj); 
    }

    if (bannerMessage) {
      showBanner(String(bannerMessage), tone || 'info');
    }
    return true;
  }

  function sendHotspotCommand(menuID, payload, bannerMessage, tone) {
    if (!HAS_HOTSPOT) {
      showBanner('Hotspot is not available on this hardware profile.', 'warning');
      return false;
    }
    const cmd = String(menuID || '').trim();
    if (!cmd) return false;

    const obj = { menuID: cmd };
    if (payload && typeof payload === 'object') {
      Object.keys(payload).forEach((key) => {
        obj[key] = payload[key];
      });
    }

    const ok = sendJson(obj, 'hotspot');
    if (!ok) {
      showBanner('Hotspot backend is not connected yet.', 'warning');
      return false;
    } else {
      console.log('Sent hotspot command:', obj);
    }

    if (bannerMessage) {
      showBanner(String(bannerMessage), tone || 'info');
    }
    return true;
  }

  function bindDataCommandButtons() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-wifi-command]');
      if (!btn) return;

      const menuID = String(btn.getAttribute('data-wifi-command') || '').trim();
      if (!menuID) return;

      let payload = null;
      const payloadRaw = btn.getAttribute('data-wifi-payload');
      if (payloadRaw) {
        try {
          payload = JSON.parse(payloadRaw);
        } catch (_) {
          showBanner('Invalid JSON in data-wifi-payload.', 'warning');
          return;
        }
      }

      const bannerMessage = btn.getAttribute('data-wifi-banner') || '';
      const bannerTone = btn.getAttribute('data-wifi-banner-tone') || 'info';
      sendCommand(menuID, payload, bannerMessage, bannerTone);
    });
  }

  function requestWiFiPage() {
    if (!HAS_WIFI) return;
    sendCommand('getWiFiPage');
    sendCommand('initNetwork');
  }

  function connectWifiSocket() {
    if (!HAS_WIFI) return;
    if (wsWifi && (wsWifi.readyState === WebSocket.OPEN || wsWifi.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      wsWifi = new WebSocket(wsUrl(WS_PORT_WIFI));
    } catch (err) {
      showBanner(`WebSocket error: ${err.message || err}`, 'danger');
      scheduleWifiReconnect();
      return;
    }

    wsWifi.addEventListener('open', () => {
      showBanner('Connected to Wi‑Fi backend.', 'success');
      if (reconnectWifiTimer) {
        clearTimeout(reconnectWifiTimer);
        reconnectWifiTimer = null;
      }
      requestWiFiPage();
    });

    wsWifi.addEventListener('message', (event) => {
      handleMessage(event.data, 'wifi');
    });

    wsWifi.addEventListener('close', () => {
      showBanner('Wi‑Fi backend disconnected. Reconnecting...', 'warning');
      scheduleWifiReconnect();
    });

    wsWifi.addEventListener('error', () => {
      showBanner('WebSocket communication error.', 'danger');
    });
  }

  function connectHotspotSocket() {
    if (!HAS_HOTSPOT) return;
    if (wsHotspot && (wsHotspot.readyState === WebSocket.OPEN || wsHotspot.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      wsHotspot = new WebSocket(wsUrl(WS_PORT_HOTSPOT));
    } catch (err) {
      showBanner(`Hotspot socket error: ${err.message || err}`, 'warning');
      scheduleHotspotReconnect();
      return;
    }

    wsHotspot.addEventListener('open', () => {
      if (reconnectHotspotTimer) {
        clearTimeout(reconnectHotspotTimer);
        reconnectHotspotTimer = null;
      }
      updateHotspotToggleButton();
      sendHotspotCommand('getPhyNetwork', null, 'getting Physical Network...', 'info');
    });

    wsHotspot.addEventListener('message', (event) => {
      handleMessage(event.data, 'hotspot');
    });

    wsHotspot.addEventListener('close', () => {
      settleHotspotToggleOnSocketClose();
      scheduleHotspotReconnect();
      updateHotspotToggleButton();
    });

    wsHotspot.addEventListener('error', () => {
      scheduleHotspotReconnect();
      updateHotspotToggleButton();
    });
  }

  function scheduleWifiReconnect() {
    if (!HAS_WIFI) return;
    if (reconnectWifiTimer) return;
    reconnectWifiTimer = setTimeout(() => {
      reconnectWifiTimer = null;
      connectWifiSocket();
    }, RECONNECT_MS);
  }

  function scheduleHotspotReconnect() {
    if (!HAS_HOTSPOT) return;
    if (reconnectHotspotTimer) return;
    reconnectHotspotTimer = setTimeout(() => {
      reconnectHotspotTimer = null;
      connectHotspotSocket();
    }, RECONNECT_MS);
  }

  function openJoinModal(ssid) {
    if (!refs.modalOverlay) return;
    refs.modalOverlay.dataset.ssid = ssid || '';
    if (refs.modalTitle) refs.modalTitle.textContent = `Join ${ssid}`;
    if (refs.passwordInput) {
      refs.passwordInput.value = '';
      refs.passwordInput.type = 'password';
    }
    if (refs.showPassword) refs.showPassword.checked = false;
    if (refs.modalError) refs.modalError.textContent = '';
    refs.modalOverlay.classList.add('show');
    setTimeout(() => {
      if (refs.passwordInput) refs.passwordInput.focus();
    }, 80);
  }

  function closeJoinModal() {
    if (!refs.modalOverlay) return;
    refs.modalOverlay.classList.remove('show');
    refs.modalOverlay.dataset.ssid = '';
    if (refs.modalError) refs.modalError.textContent = '';
  }

  function setAddressesEnabled(enabled) {
    [refs.addrIp, refs.addrMask, refs.addrGw, refs.addrDel].forEach((el) => {
      if (el) el.disabled = !enabled;
    });
  }

  function getIpv4Method() {
    const radio = document.querySelector('input[name="ipv4method"]:checked');
    return radio ? radio.value : 'auto';
  }

  function setIpv4Method(method) {
    const value = String(method || 'auto');
    document.querySelectorAll('input[name="ipv4method"]').forEach((radio) => {
      radio.checked = radio.value === value;
    });
    setAddressesEnabled(value === 'manual');
  }

  function openAdvancedModal(ssid) {
    if (!refs.advOverlay) return;
    const network = networks.find((n) => n.ESSID === ssid);
    refs.advOverlay.dataset.ssid = ssid || '';
    refs.advOverlay.classList.add('show');
    if (refs.advSub) refs.advSub.textContent = ssid ? `“${ssid}”` : 'Wi‑Fi profile';

    setIpv4Method('manual');
    if (refs.addrIp) refs.addrIp.value = normalizeIpv4((refs.ipLabel ? refs.ipLabel.textContent : '') || '');
    if (refs.addrMask) refs.addrMask.value = (refs.netmaskLabel ? refs.netmaskLabel.textContent : '') || '';
    if (refs.addrGw) refs.addrGw.value = normalizeIpv4((refs.gatewayLabel ? refs.gatewayLabel.textContent : '') || '');
    if (refs.currentIpLabel) refs.currentIpLabel.value = `Now: ${normalizeIpv4((refs.ipLabel ? refs.ipLabel.textContent : '') || '')} via ${normalizeIpv4((refs.gatewayLabel ? refs.gatewayLabel.textContent : '') || '')}`;
    if (refs.dnsAutoToggle) refs.dnsAutoToggle.checked = false;
    if (refs.dnsInput) {
      refs.dnsInput.disabled = false;
      refs.dnsInput.value = '';
    }

    if ((!network || !network.connected) && refs.currentIpLabel) {
      refs.currentIpLabel.value = 'Now: profile is saved but not currently connected';
    }
  }

  function closeAdvancedModal() {
    if (!refs.advOverlay) return;
    refs.advOverlay.classList.remove('show');
    refs.advOverlay.dataset.ssid = '';
  }

  function handleWiFiFound(msg) {
    const id = Number(msg.id != null ? msg.id : (msg.cellID != null ? msg.cellID : 0));
    const size = Number(msg.size != null ? msg.size : 0);
    if (size > 0) pendingScanSize = size;

    networks[id] = {
      id,
      cellID: Number(msg.cellID != null ? msg.cellID : id),
      ESSID: String(msg.ESSID || '').trim(),
      Protocol: String(msg.Protocol || ''),
      Frequency: String(msg.Frequency || ''),
      Encryptionkey: !!msg.Encryptionkey,
      BitRates: String(msg.BitRates || ''),
      Quality: Number(msg.Quality || 0),
      Signallevel: Number(msg.Signallevel || 0),
      Address: String(msg.Address || ''),
      password: typeof msg.password === 'string' ? msg.password : '',
      passphrase: typeof msg.passphrase === 'string' ? msg.passphrase : '',
      connected: !!msg.connected
    };

    const discoveredCount = networks.filter(Boolean).length;
    if (pendingScanSize > 0 && discoveredCount >= pendingScanSize) {
      pendingScanSize = 0;
    }

    if (!wifiEnabled) wifiEnabled = true;
    updateSummaryCard();
    renderNetworks();
  }

  function handleMessage(raw, source = 'wifi') {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch (_) {
      return;
    }

    // console.log('Received message:', msg);
    const menuID = String(msg.menuID || '');

    switch (menuID) {
      case 'clearScan':
        networks = [];
        pendingScanSize = 0;
        setNetworkSummary(0, wifiEnabled ? 'Refreshing' : 'Wi‑Fi off');
        renderNetworks();
        break;

      case 'wifiFound':
        handleWiFiFound(msg);
        break;

      case 'ssidName':
        currentSsid = String(msg.ssidName || '').trim();
        if (!networks.some((n) => n && n.connected) && currentSsid) {
          setValue(refs.currentLabel, currentSsid);
        }
        break;

      case 'onWiFi':
        wifiEnabled = true;
        setStatus(!!networks.some((n) => n && n.connected));
        renderNetworks();
        break;

      case 'offWiFi':
        wifiEnabled = false;
        setStatus(false);
        networks = [];
        renderNetworks();
        break;

      case 'onHotspot':
        setHotspotStatus(true);
        hydrateHotspotSummary(msg);
        break;

      case 'offHotspot':
        setHotspotStatus(false);
        hydrateHotspotSummary(msg);
        break;

      case 'configureHotspot':
      case 'hotspotStatus':
        hydrateHotspotSummary(msg);
        break;

      case 'Alert': {
        const text = String(msg.text || '').trim();
        if (text) showBanner(text, /fail|error|not authorized|denied/i.test(text) ? 'danger' : 'info');
        if (/hotspot/i.test(text)) {
          if (/\b(on|enabled|active|started)\b/i.test(text) && !/\b(not|cannot|failed|fail|error)\b/i.test(text)) {
            setHotspotStatus(true);
          } else if (/\b(off|disabled|inactive|stopped)\b/i.test(text)) {
            setHotspotStatus(false);
          }
        }
        requestWiFiPage();
        break;
      }

      case 'updateLocalNetwork': {
        const incomingPhy = String(msg.phyNetworkName || '').trim();
        if (source === 'hotspot') {
          hydrateHotspotSummary(msg);
          break;
        }
        if (/^hotspot$/i.test(incomingPhy)) {
          hydrateHotspotSummary(msg);
          break;
        }
        phyNetworkName = incomingPhy || phyNetworkName || 'wlan0';
        setValue(refs.deviceLabel, phyNetworkName);
        setValue(refs.ipLabel, normalizeIpv4(msg.ipaddress || ''));
        setValue(refs.gatewayLabel, normalizeIpv4(msg.gateway || ''));
        setValue(refs.netmaskLabel, msg.subnet || '—');
        break;
      }

      case 'updateLocalNetworkHotspot': {
        hydrateHotspotSummary(msg);
        break;
      }

      default:
        break;
    }
  }

  function initEvents() {
    if (refs.reloadBtn) {
      refs.reloadBtn.addEventListener('click', () => {
        showBanner('Refreshing Wi‑Fi list...', 'info');
        requestWiFiPage();
      });
    }

    if (refs.toggleBtn) {
      refs.toggleBtn.addEventListener('click', () => {
        // Always turn hotspot off first before toggling Wi‑Fi.
        if (HAS_HOTSPOT && wsHotspot && wsHotspot.readyState === WebSocket.OPEN) {
          const offHotspotPayload = { menuID: 'offhotspot' };
          wsHotspot.send(JSON.stringify(offHotspotPayload));
          console.log('Sent hotspot command:', offHotspotPayload);
        }
        sendCommand('wifiToggle', null, 'Toggling Wi‑Fi...', 'info');
      });
    }

    if (refs.hotspotToggleBtn) {
      refs.hotspotToggleBtn.addEventListener('click', () => {
        toggleHotspot();
      });
    }

    if (refs.showPassword) {
      refs.showPassword.addEventListener('change', () => {
        if (!refs.passwordInput) return;
        refs.passwordInput.type = refs.showPassword.checked ? 'text' : 'password';
      });
    }

    if (refs.modalClose) refs.modalClose.addEventListener('click', closeJoinModal);
    if (refs.modalCancel) refs.modalCancel.addEventListener('click', closeJoinModal);
    if (refs.modalOverlay) {
      refs.modalOverlay.addEventListener('click', (e) => {
        if (e.target === refs.modalOverlay) closeJoinModal();
      });
    }

    if (refs.joinBtn) {
      refs.joinBtn.addEventListener('click', () => {
        const ssid = refs.modalOverlay ? refs.modalOverlay.dataset.ssid || '' : '';
        const password = String(refs.passwordInput ? refs.passwordInput.value || '' : '').trim();
        if (!ssid) return;
        if (!password) {
          if (refs.modalError) refs.modalError.textContent = 'Please enter password.';
          if (refs.passwordInput) refs.passwordInput.focus();
          return;
        }
        if (sendCommand('selectNetwork', { ESSID: ssid, password })) {
          closeJoinModal();
          showBanner(`Connecting to “${ssid}”...`, 'info');
        }
      });
    }

    if (refs.advClose) refs.advClose.addEventListener('click', closeAdvancedModal);
    if (refs.advCancel) refs.advCancel.addEventListener('click', closeAdvancedModal);
    if (refs.advOverlay) {
      refs.advOverlay.addEventListener('click', (e) => {
        if (e.target === refs.advOverlay) closeAdvancedModal();
      });
    }

    document.querySelectorAll('input[name="ipv4method"]').forEach((radio) => {
      radio.addEventListener('change', () => setAddressesEnabled(getIpv4Method() === 'manual'));
    });

    if (refs.dnsAutoToggle) {
      refs.dnsAutoToggle.addEventListener('change', () => {
        if (refs.dnsInput) refs.dnsInput.disabled = refs.dnsAutoToggle.checked;
      });
    }

    if (refs.addrDel) {
      refs.addrDel.addEventListener('click', () => {
        if (refs.addrIp) refs.addrIp.value = '';
        if (refs.addrMask) refs.addrMask.value = '';
        if (refs.addrGw) refs.addrGw.value = '';
      });
    }

    if (refs.advDisconnect) {
      refs.advDisconnect.addEventListener('click', () => {
        const ssid = refs.advOverlay ? refs.advOverlay.dataset.ssid || '' : '';
        if (!ssid) return;
        if (sendCommand('forgotwifi', { ESSID: ssid })) {
          closeAdvancedModal();
          showBanner(`Removing saved profile for “${ssid}”...`, 'info');
        }
      });
    }

    if (refs.advSave) {
      refs.advSave.addEventListener('click', () => {
        const method = getIpv4Method();
        if (method !== 'manual') {
          showBanner('Current backend supports manual IPv4 apply from this page.', 'warning');
          return;
        }

        const ipaddress = String(refs.addrIp ? refs.addrIp.value || '' : '').trim();
        const subnet = String(refs.addrMask ? refs.addrMask.value || '' : '').trim();
        const gateway = String(refs.addrGw ? refs.addrGw.value || '' : '').trim();
        const dnsRaw = refs.dnsAutoToggle && refs.dnsAutoToggle.checked ? '' : String(refs.dnsInput ? refs.dnsInput.value || '' : '').trim();
        const dnsList = dnsRaw.split(',').map((v) => v.trim()).filter(Boolean);
        const pridns = dnsList[0] || '';
        const secdns = dnsList[1] || '';

        if (!ipaddress || !subnet) {
          showBanner('Manual mode requires IP Address and Subnet Mask.', 'warning');
          return;
        }

        const payload = {
          ipaddress,
          subnet,
          gateway,
          pridns,
          secdns,
          phyNetworkName
        };

        if (sendCommand('configureWifi', payload)) {
          closeAdvancedModal();
          showBanner('Applying Wi‑Fi IPv4 settings...', 'info');
        }
      });
    }

    if (refs.netList) {
      refs.netList.addEventListener('click', (e) => {
        const joinBtn = e.target.closest('.js-join');
        const connectBtn = e.target.closest('.js-connect');
        const connectOpenBtn = e.target.closest('.js-connect-open');
        const editBtn = e.target.closest('.js-edit');
        const disconnectBtn = e.target.closest('.js-disconnect');
        const forgetBtn = e.target.closest('.js-forget');

        if (joinBtn) {
          openJoinModal(joinBtn.dataset.ssid || '');
          return;
        }

        if (connectBtn || connectOpenBtn) {
          const selectedBtn = connectBtn || connectOpenBtn;
          const ssid = selectedBtn ? selectedBtn.dataset.ssid || '' : '';
          const network = networks.find((n) => n && n.ESSID === ssid);
          const password = connectOpenBtn ? '' : String(network && network.password ? network.password : '');

          if (!ssid) return;
          if (!connectOpenBtn && !password) {
            showBanner(`Saved password for “${ssid}” is not available. Please join again with password.`, 'warning');
            openJoinModal(ssid);
            return;
          }

          if (sendCommand('selectNetwork', { ESSID: ssid, password })) {
            showBanner(`Connecting to “${ssid}”...`, 'info');
          }
          return;
        }

        if (editBtn) {
          openAdvancedModal(editBtn.dataset.ssid || '');
          return;
        }

        if (disconnectBtn) {
          if (sendCommand('disconnectwifi')) {
            showBanner('Disconnecting current Wi‑Fi...', 'info');
          }
          return;
        }

        if (forgetBtn) {
          const ssid = forgetBtn.dataset.ssid || '';
          if (!ssid) return;
          if (sendCommand('forgotwifi', { ESSID: ssid })) {
            showBanner(`Removing saved profile for “${ssid}”...`, 'info');
          }
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeJoinModal();
        closeAdvancedModal();
      }
    });
  }

  function init() {
    if (initialized) return;
    initialized = true;
    cacheRefs();

    if (!HAS_WIFI) {
      wifiEnabled = false;
      setStatus(false);
      if (refs.reloadBtn) refs.reloadBtn.disabled = true;
      if (refs.toggleBtn) refs.toggleBtn.disabled = true;
      if (refs.hotspotToggleBtn) refs.hotspotToggleBtn.disabled = true;
      renderEmptyState('Wi‑Fi is not available', 'This hardware profile was built without Wi‑Fi support.');
      showBanner('Wi‑Fi is disabled by hardware profile.', 'warning');
      window.sendWifiCommand = () => false;
      window.sendHotspotCommand = () => false;
      window.hotspotControl = {
        on: () => false,
        off: () => false,
        delete: () => false,
        configure: () => false,
        setSsid: () => false
      };
      return;
    }

    if (!HAS_HOTSPOT && refs.hotspotToggleBtn) {
      refs.hotspotToggleBtn.disabled = true;
    }

    initEvents();
    bindDataCommandButtons();
    window.sendWifiCommand = (menuID, payload) => sendCommand(menuID, payload);
    window.sendHotspotCommand = (menuID, payload) => sendHotspotCommand(menuID, payload);
    window.hotspotControl = {
      on: () => sendHotspotCommand('onHotspot', null, 'Turning Hotspot on...', 'info'),
      off: () => sendHotspotCommand('offHotspot', null, 'Turning Hotspot off...', 'info'),
      delete: () => sendHotspotCommand('deleteHotspot', null, 'Deleting Hotspot profile...', 'info'),
      configure: (payload = {}) => sendHotspotCommand('configureHotspot', payload, 'Applying Hotspot settings...', 'info'),
      setSsid: (ssid) => sendHotspotCommand('ssidNameHotspot', { ssid: String(ssid || '').trim() }, 'Updating Hotspot SSID...', 'info')
    };
    wifiEnabled = false;
    setStatus(false);
    setHotspotStatus(false);
    setValue(refs.hotspotCurrentSsid, hotspotSsid, '—');
    setValue(refs.hotspotIpLabel, '', '—');
    setValue(refs.hotspotGatewayLabel, '', '—');
    setValue(refs.hotspotNetmaskLabel, '', '—');
    updateHotspotToggleButton();
    renderEmptyState('Connecting to backend...', 'Please wait while Wi‑Fi backend becomes available.');
    connectWifiSocket();
    if (HAS_HOTSPOT) connectHotspotSocket();

    window.addEventListener('beforeunload', () => {
      if (reconnectWifiTimer) clearTimeout(reconnectWifiTimer);
      if (reconnectHotspotTimer) clearTimeout(reconnectHotspotTimer);
      if (wsWifi) {
        try { wsWifi.close(); } catch (_) {}
      }
      if (wsHotspot) {
        try { wsHotspot.close(); } catch (_) {}
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
