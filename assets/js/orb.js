/* Wireframe orb for the home hero.
   A noise-displaced sphere drawn as a mesh, with small chrome beads in orbit.
   Draws a single still frame when motion is off. Pauses when off screen. */
(function () {
  var canvas = document.getElementById('orb');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var root = document.documentElement;

  var LAT = 34, LON = 56;
  var W = 0, H = 0, DPR = 1, R = 0;
  var t = 0, raf = null, visible = true;
  var mx = 0, my = 0, tx = 0, ty = 0;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    R = Math.min(W, H) * (W < 640 ? 0.36 : 0.3);
    if (!running()) draw();
  }

  // cheap smooth field: sum of sines, no dependency
  function field(x, y, z, s) {
    return (
      Math.sin(x * 2.1 + s * 0.9) * 0.5 +
      Math.sin(y * 2.7 - s * 0.7 + x) * 0.32 +
      Math.sin(z * 3.3 + s * 1.1 + y * 1.4) * 0.22
    );
  }

  function point(lat, lon, s, rotY, rotX) {
    var phi = (lat / LAT) * Math.PI;
    var th = (lon / LON) * Math.PI * 2;
    var x = Math.sin(phi) * Math.cos(th);
    var y = Math.cos(phi);
    var z = Math.sin(phi) * Math.sin(th);
    var d = 1 + 0.16 * field(x, y, z, s) + 0.06 * Math.sin(phi * 3 + s);
    x *= d * 1.08; y *= d * 0.92; z *= d;
    // rotate Y
    var cy = Math.cos(rotY), sy = Math.sin(rotY);
    var x1 = x * cy - z * sy, z1 = x * sy + z * cy;
    // rotate X
    var cx = Math.cos(rotX), sx = Math.sin(rotX);
    var y2 = y * cx - z1 * sx, z2 = y * sx + z1 * cx;
    var p = 3.2 / (3.2 - z2);
    return { x: W / 2 + x1 * R * p, y: H / 2 + y2 * R * p, z: z2 };
  }

  function bead(x, y, r) {
    var g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.05, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.25, 'rgba(190,190,195,0.85)');
    g.addColorStop(0.7, 'rgba(40,40,46,0.95)');
    g.addColorStop(1, 'rgba(10,10,12,1)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 0.6; ctx.stroke();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    var s = t * 0.00035;
    var rotY = s * 0.6 + mx * 0.5;
    var rotX = -0.35 + my * 0.3;

    var grid = [];
    for (var i = 0; i <= LAT; i++) {
      var row = [];
      for (var j = 0; j <= LON; j++) row.push(point(i, j, s, rotY, rotX));
      grid.push(row);
    }

    ctx.lineWidth = 0.7;
    // latitude rings
    for (i = 1; i < LAT; i++) {
      for (j = 0; j < LON; j++) {
        var a = grid[i][j], b = grid[i][j + 1];
        var depth = (a.z + b.z) / 2;
        ctx.strokeStyle = 'rgba(244,239,231,' + (0.05 + 0.22 * (depth + 1) / 2).toFixed(3) + ')';
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
    // longitude lines
    for (j = 0; j < LON; j += 1) {
      for (i = 0; i < LAT; i++) {
        a = grid[i][j]; b = grid[i + 1][j];
        depth = (a.z + b.z) / 2;
        ctx.strokeStyle = 'rgba(244,239,231,' + (0.03 + 0.16 * (depth + 1) / 2).toFixed(3) + ')';
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }

    // beads riding the surface
    var beads = [[4, 10, 0.07], [5, 14, 0.05], [6, 18, 0.06], [7, 21, 0.045], [22, 40, 0.055], [26, 44, 0.04]];
    for (var k = 0; k < beads.length; k++) {
      var p = point(beads[k][0], beads[k][1] + s * 6, s, rotY, rotX);
      if (p.z > -0.2) bead(p.x, p.y, R * beads[k][2] * (1 + p.z * 0.3));
    }
  }

  function running() { return raf !== null; }
  function loop(now) {
    t = now;
    mx += (tx - mx) * 0.04; my += (ty - my) * 0.04;
    draw();
    raf = requestAnimationFrame(loop);
  }
  function start() { if (!running() && visible && !root.classList.contains('no-motion')) raf = requestAnimationFrame(loop); }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = null; }

  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', function (e) {
    tx = (e.clientX / window.innerWidth - 0.5) * 2;
    ty = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      visible ? start() : stop();
    }).observe(canvas);
  }
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  document.addEventListener('motionchange', function (e) { e.detail.on ? start() : (stop(), draw()); });

  t = 9000;
  resize();
  draw();
  start();
})();
