// Confetti code
// Globals
var $window = $(window),
  random = Math.random,
  cos = Math.cos,
  sin = Math.sin,
  PI = Math.PI,
  PI2 = PI * 2,
  timer = undefined,
  frame = undefined,
  confetti = [];

// Settings
var particles = 150,
  spread = 40,
  sizeMin = 3,
  sizeMax = 12 - sizeMin,
  eccentricity = 10,
  deviation = 100,
  dxThetaMin = -0.1,
  dxThetaMax = -dxThetaMin - dxThetaMin,
  dyMin = 0.13,
  dyMax = 0.18,
  dThetaMin = 0.4,
  dThetaMax = 0.7 - dThetaMin;

var colorThemes = [
  function () {
    return color(
      (200 * random()) | 0,
      (200 * random()) | 0,
      (200 * random()) | 0
    );
  },
  function () {
    var black = (200 * random()) | 0;
    return color(200, black, black);
  },
  function () {
    var black = (200 * random()) | 0;
    return color(black, 200, black);
  },
  function () {
    var black = (200 * random()) | 0;
    return color(black, black, 200);
  },
  function () {
    return color(200, 100, (200 * random()) | 0);
  },
  function () {
    return color((200 * random()) | 0, 200, 200);
  },
  function () {
    var black = (256 * random()) | 0;
    return color(black, black, black);
  },
  function () {
    return colorThemes[random() < 0.5 ? 1 : 2]();
  },
  function () {
    return colorThemes[random() < 0.5 ? 3 : 5]();
  },
  function () {
    return colorThemes[random() < 0.5 ? 2 : 4]();
  },
];
function color(r, g, b) {
  return "rgb(" + r + "," + g + "," + b + ")";
}

// Cosine interpolation
function interpolation(a, b, t) {
  return ((1 - cos(PI * t)) / 2) * (b - a) + a;
}

// Create a 1D Maximal Poisson Disc over [0, 1]
var radius = 1 / eccentricity,
  radius2 = radius + radius;
function createPoisson() {
  // domain is the set of points which are still available to pick from
  // D = union{ [d_i, d_i+1] | i is even }
  var domain = [radius, 1 - radius],
    measure = 1 - radius2,
    spline = [0, 1];
  while (measure) {
    var dart = measure * random(),
      i,
      l,
      interval,
      a,
      b,
      c,
      d;

    // Find where dart lies
    for (i = 0, l = domain.length, measure = 0; i < l; i += 2) {
      (a = domain[i]), (b = domain[i + 1]), (interval = b - a);
      if (dart < measure + interval) {
        spline.push((dart += a - measure));
        break;
      }
      measure += interval;
    }
    (c = dart - radius), (d = dart + radius);

    // Update the domain
    for (i = domain.length - 1; i > 0; i -= 2) {
      (l = i - 1), (a = domain[l]), (b = domain[i]);
      // c---d          c---d  Do nothing
      //   c-----d  c-----d    Move interior
      //   c--------------d    Delete interval
      //         c--d          Split interval
      //       a------b
      if (a >= c && a < d)
        if (b > d) domain[l] = d;
        // Move interior (Left case)
        else domain.splice(l, 2);
      // Delete interval
      else if (a < c && b > c)
        if (b <= d) domain[i] = c;
        // Move interior (Right case)
        else domain.splice(i, 0, c, d); // Split interval
    }

    // Re-measure the domain
    for (i = 0, l = domain.length, measure = 0; i < l; i += 2)
      measure += domain[i + 1] - domain[i];
  }

  return spline.sort();
}

// Create the overarching container
var container = document.createElement("div");
container.style.position = "fixed";
container.style.top = "0";
container.style.left = "0";
container.style.width = "100%";
container.style.height = "0";
container.style.overflow = "visible";
container.style.zIndex = "9999";

// Confetto constructor
function Confetto(theme) {
  this.frame = 0;
  this.outer = document.createElement("div");
  this.inner = document.createElement("div");
  this.outer.appendChild(this.inner);

  var outerStyle = this.outer.style,
    innerStyle = this.inner.style;
  outerStyle.position = "absolute";
  outerStyle.width = sizeMin + sizeMax * random() + "px";
  outerStyle.height = sizeMin + sizeMax * random() + "px";
  innerStyle.width = "100%";
  innerStyle.height = "100%";
  innerStyle.backgroundColor = theme();

  outerStyle.perspective = "50px";
  outerStyle.transform = "rotate(" + 360 * random() + "deg)";
  this.axis =
    "rotate3D(" + cos(360 * random()) + "," + cos(360 * random()) + ",0,";
  this.theta = 360 * random();
  this.dTheta = dThetaMin + dThetaMax * random();
  innerStyle.transform = this.axis + this.theta + "deg)";

  this.x = $window.width() * random();
  this.y = -deviation;
  this.dx = sin(dxThetaMin + dxThetaMax * random());
  this.dy = dyMin + dyMax * random();
  outerStyle.left = this.x + "px";
  outerStyle.top = this.y + "px";

  // Create the periodic spline
  this.splineX = createPoisson();
  this.splineY = [];
  for (var i = 1, l = this.splineX.length - 1; i < l; ++i)
    this.splineY[i] = deviation * random();
  this.splineY[0] = this.splineY[l] = deviation * random();

  this.update = function (height, delta) {
    this.frame += delta;
    this.x += this.dx * delta;
    this.y += this.dy * delta;
    this.theta += this.dTheta * delta;

    // Compute spline and convert to polar
    var phi = (this.frame % 7777) / 7777,
      i = 0,
      j = 1;
    while (phi >= this.splineX[j]) i = j++;
    var rho = interpolation(
      this.splineY[i],
      this.splineY[j],
      (phi - this.splineX[i]) / (this.splineX[j] - this.splineX[i])
    );
    phi *= PI2;

    outerStyle.left = this.x + rho * cos(phi) + "px";
    outerStyle.top = this.y + rho * sin(phi) + "px";
    innerStyle.transform = this.axis + this.theta + "deg)";
    return this.y > height + deviation;
  };
}

function poof() {
  if (!frame) {
    // Append the container
    document.body.appendChild(container);

    // Add confetti
    var theme = colorThemes[(colorThemes.length * random()) | 0],
      count = 0;
    (function addConfetto() {
      if (++count > particles) return (timer = undefined);

      var confetto = new Confetto(theme);
      confetti.push(confetto);
      container.appendChild(confetto.outer);
      timer = setTimeout(addConfetto, spread * random());
    })(0);

    // Start the loop
    var prev = undefined;
    requestAnimationFrame(function loop(timestamp) {
      var delta = prev ? timestamp - prev : 0;
      prev = timestamp;
      var height = $window.height();

      for (var i = confetti.length - 1; i >= 0; --i) {
        if (confetti[i].update(height, delta)) {
          container.removeChild(confetti[i].outer);
          confetti.splice(i, 1);
        }
      }

      if (timer || confetti.length)
        return (frame = requestAnimationFrame(loop));

      // Cleanup
      document.body.removeChild(container);
      frame = undefined;
    });
  }
}
//----------------------

function getTimeRemaining(endtime) {
  var t = Math.max(Date.parse(endtime) - new Date(), 0);
  var seconds = Math.floor((t / 1000) % 60);
  var minutes = Math.floor((t / 1000 / 60) % 60);
  var hours = Math.floor((t / (1000 * 60 * 60)) % 24);
  var days = Math.floor(t / (1000 * 60 * 60 * 24));
  return {
    total: t,
    days: days,
    hours: hours,
    minutes: minutes,
    seconds: seconds,
  };
}

function initializeClock(endtime) {
  var timeDelta = deadline - start;

  var clock = document.getElementById("clockdiv");
  var daysSpan = clock.querySelector(".days");
  var hoursSpan = clock.querySelector(".hours");
  var minutesSpan = clock.querySelector(".minutes");
  var secondsSpan = clock.querySelector(".seconds");

  var progressBar = document.getElementById("progress-bar");
  var progressBarLabel = progressBar.children[0];
  var progressBarLine = progressBar.children[1];

  var nextPercentText = document.getElementById("next-percent-time");
  var numRepeatsText = document.getElementById("num-repeats");
  var nextNPercentText = document.getElementById("next-n-percent-time");

  var confetti = false;

  function updateClock() {
    var t = getTimeRemaining(endtime);

    if (t.days >= 100) {
      daysSpan.innerHTML = t.days.toString();
    } else {
      daysSpan.innerHTML = ("0" + t.days).slice(-2);
    }

    hoursSpan.innerHTML = ("0" + t.hours).slice(-2);
    minutesSpan.innerHTML = ("0" + t.minutes).slice(-2);
    secondsSpan.innerHTML = ("0" + t.seconds).slice(-2);

    if (t.total <= 0) {
      clearInterval(timeinterval);
    }

    var currentTime = new Date();
    var percentFinished = Math.min(
      100,
      (100 * (currentTime - start)) / timeDelta
    );

    // Make confetti fall if percentage is whole number
    if (
      Math.abs(((Math.floor(percentFinished * 100) / 100) % 1) - 0) < 0.00001
    ) {
      if (!confetti) {
        poof();
      }
      confetti = true;
    } else {
      confetti = false;
    }

    progressBarLabel.innerHTML = Math.floor(percentFinished * 100) / 100 + "%";
    progressBarLine.children[0].style.width =
      Math.floor(percentFinished * 100) / 100 + "%";

    var numRepeats =
      Math.floor(((100 - percentFinished) / percentFinished) * 100) / 100;
    numRepeatsText.innerHTML = "Only " + numRepeats + "x more waiting!";

    var nextPercent = Math.floor(percentFinished + 1) / 100;
    var nextPercentTime = new Date(start.getTime() + nextPercent * timeDelta);
    nextPercentText.innerHTML = "Next percent at " + nextPercentTime.toString();

    nextNPercentText.innerHTML = "";
    var nextPercents = [10, 20, 25, 30, 40, 50, 60, 69, 70, 75, 80, 90, 100];
    for (var i = 0; i < nextPercents.length; i++) {
      if (percentFinished > nextPercents[i]) {
        continue;
      }
      var percent = nextPercents[i] / 100;
      var percentTime = new Date(start.getTime() + percent * timeDelta);
      nextNPercentText.innerHTML +=
        nextPercents[i].toString() +
        "% at " +
        percentTime.toString() +
        "<br />";
    }
  }

  updateClock();
  var timeinterval = setInterval(updateClock, 1000);
}

var start = new Date("3 Jun 2022 08:00:00 EDT");
var deadline = new Date("6 Aug 2022 10:25:00 PDT");
initializeClock(deadline);
