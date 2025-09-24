// Helicopter Game
var DELAY = 40;
var SPEED = 5;
var MAX_DY = 13;
var OBSTACLE_WIDTH = 20;
var OBSTACLE_HEIGHT = 100;
var highScore = localStorage.getItem("copterHighScore") || 0;
var gameMode = "Classic"; // "Classic" or "NuCopter"
var speedFactor = 1;

var copter;
var dy = SPEED;
var clicking = false;
var score = 0;
var scoreLabel;
var menuButton;
var restartButton;
var menuButton;
var classicBtn;
var nuBtn;
var restartButton;

var obstacles = [];
var collectibles = [];
var dustParticles = [];
var topTerrain = [];
var bottomTerrain = [];
var allUI = []; // Track all UI elements for cleanup
var parallaxLayers = [];
var stars = [];
var explosionParticles = [];


function initParallax() {
    // Gradient night sky (stacked rectangles)
    var steps = 100; 
    for (var i = 0; i < steps; i++) {
        var rect = new Rectangle(getWidth(), getHeight() / steps);
        var ratio = i / steps;
        var r = 10 + Math.floor(30 * ratio);   // from 10 → 40
        var g = 10 + Math.floor(20 * ratio);   // from 10 → 30
        var b = 40 + Math.floor(80 * ratio);   // from 40 → 120
        rect.setColor(new Color(r, g, b));
        rect.setPosition(0, i * (getHeight() / steps));
        add(rect);
        parallaxLayers.push({ obj: rect, speed: 0 });
    }

    // Stars
    for (var i = 0; i < 50; i++) {
        var star = new Circle(1 + Randomizer.nextInt(0, 1));
        star.setColor(Color.white);
        star.setPosition(Randomizer.nextInt(0, getWidth()), Randomizer.nextInt(0, getHeight()));
        add(star);
        parallaxLayers.push({ obj: star, speed: 0.5 });
        stars.push(star); // keep reference
    }
    

    // Distant hills
    for (var i = 0; i < 3; i++) {
        var hill = new Rectangle(getWidth(), 100);
        hill.setColor(new Color(20, 20, 50));
        hill.setPosition(i * getWidth(), getHeight() - 100);
        add(hill);
        parallaxLayers.push({ obj: hill, speed: 1 });
    }

    // Foreground hills
    for (var i = 0; i < 3; i++) {
        var fg = new Rectangle(getWidth(), 60);
        fg.setColor(new Color(5, 5, 20));
        fg.setPosition(i * getWidth(), getHeight() - 60);
        add(fg);
        parallaxLayers.push({ obj: fg, speed: 2 });
    }
}

function showMenu() {
    setBackgroundColor(Color.black);

    var title = new Text("Helicopter Game", "30pt Arial");
    title.setColor(Color.white);
    title.setPosition(getWidth()/2 - title.getWidth()/2, 100);
    add(title); allUI.push(title);

    menuButton = new Rectangle(150, 50);
    menuButton.setColor(Color.green);
    menuButton.setPosition(getWidth()/2 - 75, 180);
    add(menuButton); allUI.push(menuButton);

    var label = new Text("Play (Default)", "20pt Arial");
    label.setColor(Color.black);
    label.setPosition(getWidth()/2 - label.getWidth()/2, 210);
    add(label); 
    allUI.push(label);

    classicBtn = new Rectangle(150, 40);
    classicBtn.setColor(Color.blue);
    classicBtn.setPosition(getWidth()/2 - 75, 250);
    add(classicBtn); allUI.push(classicBtn);

    var classicLabel = new Text("Classic Mode", "16pt Arial");
    classicLabel.setColor(Color.white);
    classicLabel.setPosition(getWidth()/2 - classicLabel.getWidth()/2, 275);
    add(classicLabel); allUI.push(classicLabel);

    nuBtn = new Rectangle(150, 40);
    nuBtn.setColor(Color.purple);
    nuBtn.setPosition(getWidth()/2 - 75, 300);
    add(nuBtn); allUI.push(nuBtn);

    var nuLabel = new Text("NuCopter Mode", "16pt Arial");
    nuLabel.setColor(Color.white);
    nuLabel.setPosition(getWidth()/2 - nuLabel.getWidth()/2, 325);
    add(nuLabel); allUI.push(nuLabel);

    // single handler
    mouseClickMethod(menuClickHandler);
}

function menuClickHandler(e) {
    if (inside(e, menuButton)) {
        gameMode = "Classic"; // default if Play is pressed
        clearUI();
        mouseClickMethod(null);
        startGame();
    } else if (inside(e, classicBtn)) {
        gameMode = "Classic";
        clearUI();
        mouseClickMethod(null);
        startGame();
    } else if (inside(e, nuBtn)) {
        gameMode = "NuCopter";
        clearUI();
        mouseClickMethod(null);
        startGame();
    }
}



function showRestart() {
    restartButton = new Rectangle(140, 40);
    restartButton.setPosition(getWidth()/2 - 70, getHeight()/2 + 90);
    restartButton.setColor(Color.orange);
    add(restartButton); allUI.push(restartButton);

    var label = new Text("Play Again", "18pt Arial");
    label.setColor(Color.black);
    label.setPosition(getWidth()/2 - 50, getHeight()/2 + 118);
    add(label); allUI.push(label);

    mouseClickMethod(restartClickHandler);
}

function restartClickHandler(e) {
    if (restartButton &&
        e.getX() >= restartButton.getX() && e.getX() <= restartButton.getX() + restartButton.getWidth() &&
        e.getY() >= restartButton.getY() && e.getY() <= restartButton.getY() + restartButton.getHeight()) {

        clearUI();
        var stopper = new Rectangle(9699, 9990);
        stopper.setColor(Color.black);
        add(stopper);
        mouseClickMethod(null);
        showMenu();
    }
}

function clearUI() {
    for (var i = 0; i < allUI.length; i++) {
        remove(allUI[i]);
    }
    allUI = [];
}

function startGame() {
    console.log(gameMode)
    setup();
    setTimer(game, DELAY);
    mouseDownMethod(onMouseDown);
    mouseUpMethod(onMouseUp);
}

function setup() {
    speedFactor = 1;
    dy = SPEED * speedFactor;
    score = 0;
    obstacles = [];
    collectibles = [];
    dustParticles = [];
    topTerrain = [];
    bottomTerrain = [];

    setBackgroundColor(Color.black);
    initParallax();
    copter = new WebImage("assets/helicopter.png");
    copter.setSize(60, 30);
    copter.setPosition(getWidth()/3, getHeight()/2);
    add(copter);

    scoreLabel = new Text("Score: 0", "20pt Arial");
    scoreLabel.setColor(Color.white);
    scoreLabel.setPosition(10, 25);
    add(scoreLabel);

    var terrainHeight = 40;
    var segmentWidth = 50;
    var segments = Math.ceil(getWidth() / segmentWidth) + 1;

    for (var i = 0; i < segments; i++) {
        var top = new Rectangle(segmentWidth, terrainHeight);
        top.setPosition(i * segmentWidth, 0);
        top.setColor(new Color(40, 40, 70));  
        topTerrain.push(top);
        add(top);

        var bottom = new Rectangle(segmentWidth, terrainHeight);
        bottom.setPosition(i * segmentWidth, getHeight() - terrainHeight);
        bottom.setColor(new Color(40, 40, 70));
        bottomTerrain.push(bottom);
        add(bottom);
    }

    addObstacles();
}

function game() {
    score++;
    if (scoreLabel) remove(scoreLabel);
    scoreLabel = new Text("Score: " + score, "20pt Arial");
    scoreLabel.setColor(Color.white);
    scoreLabel.setPosition(10, 25);
    add(scoreLabel);
    if (gameMode === "NuCopter") {
        speedFactor += 0.005;
    } else {
        speedFactor = 1;
    }

    moveParallax();
    updateStars();
    spawnDust();
    updateDust();
    moveTerrain();
    moveObstacles();
    updateCollectibles();
    animateCollectibles();
    updateExplosion();

    // physics
    if (clicking) {
        dy = Math.max(dy - 1, -MAX_DY);
    } else {
        dy = Math.min(dy + 1, MAX_DY);
    }
    copter.move(0, dy);
    updateCopterRotation();
    // check terrain collisions
    for (var i = 0; i < topTerrain.length; i++) {
        if (isColliding(copter, topTerrain[i]) || isColliding(copter, bottomTerrain[i])) {
            endGame();
            return;
        }
    }

    // check obstacle collisions
    for (var i = 0; i < obstacles.length; i++) {
        var o = obstacles[i];
        if (o.type === "gap") {
            if (isColliding(copter, o.top) || isColliding(copter, o.bottom)) {
                endGame();
                return;
            }
        } else {
            if (isColliding(copter, o.rect)) {
                endGame();
                return;
            }
        }
    }

    // check collectibles
    for (var i = collectibles.length - 1; i >= 0; i--) {
        if (isColliding(copter, collectibles[i])) {
            score += 50;
            remove(collectibles[i]);
            collectibles.splice(i, 1);
        }
    }
}


function endGame() {
    stopTimer(game); // stop the main loop

    spawnExplosion(copter.getX() + copter.getWidth()/2,
                   copter.getY() + copter.getHeight()/2);
    remove(copter);

    // Start a new timer just for explosions
    setTimer(updateExplosion, 40);

    var loseText = new Text("You Lose", "30pt Arial");
    loseText.setColor(Color.red);
    loseText.setPosition(getWidth()/2 - loseText.getWidth()/2, getHeight()/2);
    add(loseText); allUI.push(loseText);

    if (score > highScore) {
        highScore = score;
        localStorage.setItem("copterHighScore", highScore);
    }

    var finalScore = new Text("Final Score: " + score, "20pt Arial");
    finalScore.setColor(Color.white);
    finalScore.setPosition(getWidth()/2 - finalScore.getWidth()/2, getHeight()/2 + 40);
    add(finalScore); allUI.push(finalScore);

    var bestScore = new Text("High Score: " + highScore, "18pt Arial");
    bestScore.setColor(Color.yellow);
    bestScore.setPosition(getWidth()/2 - bestScore.getWidth()/2, getHeight()/2 + 70);
    add(bestScore); allUI.push(bestScore);
    var medalText;
    if (score >= 2000) {
        medalText = "🏅 Platinum Medal!";
    } else if (score >= 1000) {
        medalText = "🥇 Gold Medal!";
    } else if (score >= 500) {
        medalText = "🥈 Silver Medal!";
    } else if (score >= 200) {
        medalText = "🥉 Bronze Medal!";
    }

    if (medalText) {
        var medal = new Text(medalText, "18pt Arial");
        medal.setColor(Color.cyan);
        medal.setPosition(getWidth()/2 - medal.getWidth()/2, getHeight()/2 + 100);
        add(medal); allUI.push(medal);
    }


    showRestart();
}



function moveParallax() {
    for (var i = 0; i < parallaxLayers.length; i++) {
        var layer = parallaxLayers[i];
        if (layer.speed > 0) {
            layer.obj.move(-layer.speed, 0);

            // Wrap around
            if (layer.obj.getX() + layer.obj.getWidth() < 0) {
                layer.obj.setPosition(getWidth(), layer.obj.getY());
            }
        }
    }
}
function animateCollectibles() {
    for (var i = 0; i < collectibles.length; i++) {
        var c = collectibles[i];
        // store a tick counter on the object
        if (!c.t) c.t = 0;
        c.t++;

        // oscillate radius to fake squish/spin
        var scale = 1 + 0.3 * Math.sin(c.t * 0.2); // between 0.7x and 1.3x
        c.setRadius(10 * scale);
    }
}



function addObstacles() {
    for (var i = 0; i < 17; i++) {
        var spacing = 300;
        var x = getWidth() + i * spacing;

        if (Randomizer.nextBoolean()) {
            // GAP OBSTACLE
            var gap = Math.max(100, getHeight() / 5);
            var topH = Randomizer.nextInt(40, getHeight() - gap - 40);
            var botY = topH + gap;

            var glowTop = new Rectangle(OBSTACLE_WIDTH + 10, topH + 10);
            glowTop.setColor(new Color(100, 180, 255, 80));
            glowTop.setPosition(x - 5, -5);
            add(glowTop);

            var topObs = new Rectangle(OBSTACLE_WIDTH, topH);
            topObs.setColor(new Color(70, 100, 150));
            topObs.setPosition(x, 0);
            add(topObs);

            var glowBot = new Rectangle(OBSTACLE_WIDTH + 10, getHeight() - botY + 10);
            glowBot.setColor(new Color(100, 180, 255, 80));
            glowBot.setPosition(x - 5, botY - 5);
            add(glowBot);

            var bottomObs = new Rectangle(OBSTACLE_WIDTH, getHeight() - botY);
            bottomObs.setColor(new Color(70, 100, 150));
            bottomObs.setPosition(x, botY);
            add(bottomObs);

            obstacles.push({ type: "gap", x: x, top: topObs, topGlow: glowTop, bottom: bottomObs, bottomGlow: glowBot });

        } else {
            // SINGLE BLOCK
            var y = Randomizer.nextInt(50, getHeight() - OBSTACLE_HEIGHT - 50);

            var glow = new Rectangle(OBSTACLE_WIDTH + 10, OBSTACLE_HEIGHT + 10);
            glow.setColor(new Color(100, 180, 255, 80));
            glow.setPosition(x - 5, y - 5);
            add(glow);

            var obs = new Rectangle(OBSTACLE_WIDTH, OBSTACLE_HEIGHT);
            obs.setColor(new Color(70, 100, 150));
            obs.setPosition(x, y);
            add(obs);

            obstacles.push({ type: "block", x: x, rect: obs, glow: glow });
        }

        if (i % 2 === 0) spawnCollectible(x + 100);
    }
}
function spawnExplosion(x, y) {
    for (var i = 0; i < 30; i++) {
        var p = new Circle(3 + Math.random() * 3);
        p.setColor(new Color(
            200 + Math.random()*55,
            Math.random()*150,
            0
        ));
        p.setPosition(x, y);
        p.vx = (Math.random() - 0.5) * 10;
        p.vy = (Math.random() - 0.5) * 10;
        p.life = 30 + Math.random()*20;
        add(p);
        explosionParticles.push(p);
    }
}

function updateExplosion() {
    for (var i = explosionParticles.length - 1; i >= 0; i--) {
        var p = explosionParticles[i];
        p.move(p.vx, p.vy);
        p.vx *= 0.95; 
        p.vy *= 0.95; 
        p.life--;

        if (p.life <= 0) {
            remove(p);
            explosionParticles.splice(i, 1);
        }
    }

    // Stop updating once no particles are left
    if (explosionParticles.length === 0) {
        stopTimer(updateExplosion);
    }
}




function moveObstacles() {
    for (var i = 0; i < obstacles.length; i++) {
        var o = obstacles[i];
        if (o.type === "gap") {
            o.top.move(-SPEED * speedFactor, 0);
            o.topGlow.move(-SPEED * speedFactor, 0);
            o.bottom.move(-SPEED * speedFactor, 0);
            o.bottomGlow.move(-SPEED * speedFactor, 0);

            if (o.top.getX() + OBSTACLE_WIDTH < 0) {
                var rightmost = getRightmostXGroup();
                var gap = 100;
                var topH = Randomizer.nextInt(40, getHeight() - gap - 40);
                var botY = topH + gap;

                o.top.setPosition(rightmost + 150, 0);
                o.top.setHeight(topH);
                o.topGlow.setPosition(rightmost + 145, -5);
                o.topGlow.setHeight(topH + 10);

                o.bottom.setPosition(rightmost + 150, botY);
                o.bottom.setHeight(getHeight() - botY);
                o.bottomGlow.setPosition(rightmost + 145, botY - 5);
                o.bottomGlow.setHeight(getHeight() - botY + 10);
            }
        } else {
            o.rect.move(-SPEED * speedFactor, 0);
            o.glow.move(-SPEED * speedFactor, 0);

            if (o.rect.getX() + OBSTACLE_WIDTH < 0) {
                var rightmost = getRightmostXGroup();
                var y = Randomizer.nextInt(50, getHeight() - OBSTACLE_HEIGHT - 50);
                o.rect.setPosition(rightmost + 150, y);
                o.glow.setPosition(rightmost + 145, y - 5);
            }
        }
    }
}

function getRightmostXGroup() {
    var max = 0;
    for (var i = 0; i < obstacles.length; i++) {
        var o = obstacles[i];
        var x = (o.type === "gap") ? o.top.getX() : o.rect.getX();
        if (x > max) max = x;
    }
    return max + OBSTACLE_WIDTH;
}

function spawnCollectible(x) {
    var c = new Circle(10);
    c.setColor(Color.yellow);
    c.setPosition(x, Randomizer.nextInt(50, getHeight() - 50));
    collectibles.push(c);
    add(c);
}

function updateCollectibles() {
    for (var i = collectibles.length - 1; i >= 0; i--) {
        collectibles[i].move(-SPEED * speedFactor, 0);
        if (collectibles[i].getX() < -20) {
            remove(collectibles[i]);
            collectibles.splice(i, 1);
        }
    }
}

function moveTerrain() {
    for (var i = 0; i < topTerrain.length; i++) {
        topTerrain[i].move(-SPEED * speedFactor, 0);
        bottomTerrain[i].move(-SPEED * speedFactor, 0);

        if (topTerrain[i].getX() + topTerrain[i].getWidth() < 0) {
            var rightX = getRightmostX(topTerrain);
            var newTop = Randomizer.nextInt(20, 60);
            var newBottom = Randomizer.nextInt(20, 60);

            topTerrain[i].setPosition(rightX, 0);
            topTerrain[i].setHeight(newTop);
            bottomTerrain[i].setPosition(rightX, getHeight() - newBottom);
            bottomTerrain[i].setHeight(newBottom);
        }
    }
}

function spawnDust() {
    var d = new Circle(2 + Math.random()*2);
    d.setColor(new Color(180+Randomizer.nextInt(-20,20),
                         180+Randomizer.nextInt(-20,20),
                         180+Randomizer.nextInt(-20,20)));
    d.setPosition(copter.getX(), copter.getY() + copter.getHeight() / 2);
    d.radius = d.getRadius();
    d.vx = -SPEED * speedFactor - Math.random()*2; // backward drift
    d.vy = (Math.random() - 0.5) * 2; // little up/down
    d.life = 30; // frames to live
    dustParticles.push(d);
    add(d);
}

function updateDust() {
    for (var i = dustParticles.length - 1; i >= 0; i--) {
        var d = dustParticles[i];
        d.move(d.vx, d.vy);
        d.radius *= 0.95;
        d.life--;

        if (d.life <= 0 || d.radius < 0.5) {
            remove(d);
            dustParticles.splice(i, 1);
        } else {
            d.setRadius(d.radius);
            var c = Math.max(50, Math.floor(200 * (d.life / 30))); // fade out
            d.setColor(new Color(c, c, c));
        }
    }
}

function updateStars() {
    for (var i = 0; i < stars.length; i++) {
        var star = stars[i];
        // small chance to flicker
        if (Randomizer.nextInt(0, 20) === 0) {
            var newRadius = 0.5 + Math.random() * 2; // between 0.5 and 2.5
            star.setRadius(newRadius);
        }
        if (Randomizer.nextInt(0, 30) === 0) {
            var c = 180 + Randomizer.nextInt(0, 75); // brightness range
            star.setColor(new Color(c, c, c));
        }
    }
}

function isColliding(a, b) {
    return a.getX() < b.getX() + b.getWidth() &&
           a.getX() + a.getWidth() > b.getX() &&
           a.getY() < b.getY() + b.getHeight() &&
           a.getY() + a.getHeight() > b.getY();
}

function getRightmostX(array) {
    var max = 0;
    for (var i = 0; i < array.length; i++) {
        var x = array[i].getX();
        if (x > max) max = x;
    }
    return max + array[0].getWidth();
}

function updateCopterRotation() {
    // tilt proportionally to dy
    var angle = Math.max(-30, Math.min(30, dy * 2));
    copter.setRotation(angle);
}

function inside(e, rect) {
    return (
        e.getX() >= rect.getX() &&
        e.getX() <= rect.getX() + rect.getWidth() &&
        e.getY() >= rect.getY() &&
        e.getY() <= rect.getY() + rect.getHeight()
    );
}

function onMouseDown(e) { clicking = true; }
function onMouseUp(e) { clicking = false; }
setSize(window.innerWidth, window.innerHeight);
showMenu();

window.addEventListener("resize", function() {
  setSize(window.innerWidth, window.innerHeight);
});
