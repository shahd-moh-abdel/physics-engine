//hope you like it 
class Vector2D {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  add(v) {
    return new Vector2D(this.x + v.x, this.y + v.y);
  }

  subtract(v) {
    return new Vector2D(this.x - v.x, this.y - v.y);
  }

  multiply(scalar) {
    return new Vector2D(this.x * scalar, this.y * scalar);
  }

  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize() {
    const mag = this.magnitude();
    return new Vector2D(this.x / mag, this.y / mag);
  }
}

class PhysicsObject {
  constructor(x, y, radius, mass) {
    this.position = new Vector2D(x, y);
    this.velocity = new Vector2D(0, 0);
    this.acceleration = new Vector2D(0, 0);
    this.radius = radius;
    this.mass = mass;
    this.color = this.randomColor();
    this.isDragged = false;
  }

  applyForce(force) {
    const acceleration = force.multiply(1 / this.mass);
    this.acceleration = this.acceleration.add(acceleration);
  }

  update(dt) {
    if (!this.isDragged) {
      this.velocity = this.velocity.add(this.acceleration.multiply(dt));
      this.position = this.position.add(this.velocity.multiply(dt));
    }
    this.acceleration = new Vector2D(0, 0);
  }

  randomColor() {
    return `rgb(${Math.random() * 255},${Math.random() * 255},${
      Math.random() * 255
    })`;
  }
}

class PhysicsEngine {
  constructor(width, height, gravity = 9.81) {
    this.width = width;
    this.height = height;
    this.gravity = new Vector2D(0, gravity);
    this.objects = [];
  }

  updateGravity(x, y) {
    const magnitude = 500; // Adjust this value to change the strength of gravity
    this.gravity = new Vector2D(x * magnitude, y * magnitude);
  }

  addObject(object) {
    this.objects.push(object);
  }

  update(dt) {
    for (const object of this.objects) {
      if (!object.isDragged) {
        object.applyForce(this.gravity.multiply(object.mass));
      }
      object.update(dt);
      this.handleBoundaryCollision(object);
    }

    this.handleObjectCollisions();
  }
  handleBoundaryCollision(object) {
    if (object.position.x - object.radius < 0) {
      object.position.x = object.radius;
      object.velocity.x *= -0.9;
    } else if (object.position.x + object.radius > this.width) {
      object.position.x = this.width - object.radius;
      object.velocity.x *= -0.9;
    }

    if (object.position.y - object.radius < 0) {
      object.position.y = object.radius;
      object.velocity.y *= -0.9;
    } else if (object.position.y + object.radius > this.height) {
      object.position.y = this.height - object.radius;
      object.velocity.y *= -0.9;
    }
  }

  handleObjectCollisions() {
    for (let i = 0; i < this.objects.length; i++) {
      for (let j = i + 1; j < this.objects.length; j++) {
        const obj1 = this.objects[i];
        const obj2 = this.objects[j];

        if (obj1.isDragged && obj2.isDragged) continue;

        const distance = obj1.position.subtract(obj2.position).magnitude();
        if (distance < obj1.radius + obj2.radius) {
          this.resolveCollision(obj1, obj2);
        }
      }
    }
  }

  resolveCollision(obj1, obj2) {
    // Collision resolution logic remains the same
    // But we'll add a check to not change velocity of dragged objects
    const normal = obj1.position.subtract(obj2.position).normalize();
    const relativeVelocity = obj1.velocity.subtract(obj2.velocity);
    const separatingVelocity =
      relativeVelocity.x * normal.x + relativeVelocity.y * normal.y;
    const newSeparatingVelocity = -separatingVelocity * 0.9;
    const separatingVelocityDiff = newSeparatingVelocity - separatingVelocity;
    const impulse = separatingVelocityDiff / (1 / obj1.mass + 1 / obj2.mass);
    const impulseVector = normal.multiply(impulse);

    if (!obj1.isDragged) {
      obj1.velocity = obj1.velocity.add(impulseVector.multiply(1 / obj1.mass));
    }
    if (!obj2.isDragged) {
      obj2.velocity = obj2.velocity.subtract(
        impulseVector.multiply(1 / obj2.mass)
      );
    }

    // Separate overlapping objects
    const overlap =
      obj1.radius +
      obj2.radius -
      obj1.position.subtract(obj2.position).magnitude();
    const separation = normal.multiply(overlap / 2);
    if (!obj1.isDragged) obj1.position = obj1.position.add(separation);
    if (!obj2.isDragged) obj2.position = obj2.position.subtract(separation);
  }
}

// Canvas setup
const canvas = document.getElementById("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext("2d");

// Initialize physics engine
const engine = new PhysicsEngine(canvas.width, canvas.height, 200);

// Rendering function
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const object of engine.objects) {
    ctx.beginPath();
    ctx.arc(
      object.position.x,
      object.position.y,
      object.radius,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = object.color;
    ctx.fill();
    ctx.closePath();
  }
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
  const deltaTime = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  engine.update(deltaTime);
  render();

  requestAnimationFrame(gameLoop);
}

// Start the game loop
requestAnimationFrame(gameLoop);

class InteractivePhysicsSimulation {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.engine = new PhysicsEngine(this.canvas.width, this.canvas.height, 200);

    this.draggedObject = null;
    this.dragOffset = new Vector2D(0, 0);

    window.addEventListener("load", () => this.setupOrientationListener());
    this.createInitialObjects();
  }

  requestOrientationPermission() {
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      DeviceOrientationEvent.requestPermission()
        .then((permissionState) => {
          if (permissionState === "granted") {
            window.addEventListener(
              "deviceorientation",
              this.handleOrientation.bind(this)
            );
          }
        })
        .catch(console.error);
    } else {
      window.addEventListener(
        "deviceorientation",
        this.handleOrientation.bind(this)
      );
    }
  }

  setupOrientationListener() {
    if (window.DeviceOrientationEvent) {
        //this.requestOrientationPermission();
      });
    }
  }

  handleOrientation(event) {
    const x = event.gamma ? event.gamma / 90 : 0; // Convert to range [-1, 1]
    const y = event.beta ? (event.beta - 45) / 90 : 0; // Convert to range [-1, 1], 45 degrees is neutral
    this.engine.updateGravity(x, y);
  }

  setupEventListeners() {
    this.canvas.addEventListener("mousedown", this.handleStart.bind(this));
    this.canvas.addEventListener("mousemove", this.handleMove.bind(this));
    this.canvas.addEventListener("mouseup", this.handleEnd.bind(this));
    this.canvas.addEventListener("mouseleave", this.handleEnd.bind(this));

    this.canvas.addEventListener("touchstart", this.handleStart.bind(this));
    this.canvas.addEventListener("touchmove", this.handleMove.bind(this));
    this.canvas.addEventListener("touchend", this.handleEnd.bind(this));
    this.canvas.addEventListener("touchcancel", this.handleEnd.bind(this));
  }

  createInitialObjects() {
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * this.canvas.width;
      const y = Math.random() * this.canvas.height;
      const radius = 10 + Math.random() * 20;
      const mass = radius * 0.1;
      this.engine.addObject(new PhysicsObject(x, y, radius, mass));
    }
  }

  handleStart(event) {
    event.preventDefault();
    const pos = this.getEventPos(event);
    for (const object of this.engine.objects) {
      if (this.isPointInCircle(pos, object)) {
        this.draggedObject = object;
        this.draggedObject.isDragged = true;
        this.dragOffset = pos.subtract(object.position);
        break;
      }
    }
  }

  handleMove(event) {
    event.preventDefault();
    if (this.draggedObject) {
      const pos = this.getEventPos(event);
      this.draggedObject.position = pos.subtract(this.dragOffset);
    }
  }

  handleEnd(event) {
    event.preventDefault();
    if (this.draggedObject) {
      this.draggedObject.isDragged = false;
      this.draggedObject = null;
    }
  }

  getEventPos(event) {
    const rect = this.canvas.getBoundingClientRect();
    const clientX =
      event.clientX || (event.touches && event.touches[0].clientX);
    const clientY =
      event.clientY || (event.touches && event.touches[0].clientY);
    return new Vector2D(clientX - rect.left, clientY - rect.top);
  }

  getMousePos(event) {
    const rect = this.canvas.getBoundingClientRect();
    return new Vector2D(event.clientX - rect.left, event.clientY - rect.top);
  }

  isPointInCircle(point, circle) {
    return point.subtract(circle.position).magnitude() <= circle.radius;
  }

  update(deltaTime) {
    this.engine.update(deltaTime);
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const object of this.engine.objects) {
      this.ctx.beginPath();
      this.ctx.arc(
        object.position.x,
        object.position.y,
        object.radius,
        0,
        Math.PI * 2
      );
      this.ctx.fillStyle = object.color;
      this.ctx.fill();
      this.ctx.closePath();
    }
  }

  start() {
    let lastTime = 0;
    const gameLoop = (timestamp) => {
      const deltaTime = (timestamp - lastTime) / 1000;
      lastTime = timestamp;

      this.update(deltaTime);
      this.render();

      requestAnimationFrame(gameLoop);
    };

    requestAnimationFrame(gameLoop);
  }
}

// Initialize and start the simulation
const simulation = new InteractivePhysicsSimulation("canvas");
simulation.start();
