export class CanvasApp {
  private theCanvas: any;
  private context: any;
  private selector: string;
  private sphereRad: number;
  private speed: number;
  private radius_sp: number;
  private opt_display_dots: boolean;
  private data?: any[];

  private displayWidth: any;
  private displayHeight: any;
  private timer: any;
  private wait: any;
  private count: any;
  private numToAddEachFrame: any;
  private particleList: any;
  private recycleBin: any;
  private particleAlpha: any;
  private r: any;
  private g: any;
  private b: any;
  private fLen: any;
  private m: any;
  private projCenterX: any;
  private projCenterY: any;
  private zMax: any;
  private turnAngle: any;
  private turnSpeed: any;
  private sphereCenterX: any;
  private sphereCenterY: any;
  private sphereCenterZ: any;
  private particleRad: any;
  private zeroAlphaDepth: any;
  private randAccelX: any;
  private randAccelY: any;
  private randAccelZ: any;
  private gravity: any;
  private rgbString: any;
  //we are defining a lot of variables used in the screen update functions globally so that they don't have to be redefined every frame.
  private p: any;
  private outsideTest: any;
  private nextParticle: any;
  private sinAngle: any;
  private cosAngle: any;
  private rotX: any;
  private rotZ: any;
  private depthAlphaFactor: any;
  private i: any;
  private theta: any;
  private phi: any;
  private x0: any;
  private y0: any;
  private z0: any;

  constructor(selector: string, sphereRad: number, speed: number, radius_sp: number, opt_display_dots: boolean) {
    this.selector = selector;
    this.sphereRad = sphereRad;
    this.speed = speed;
    this.radius_sp = radius_sp;
    this.opt_display_dots = opt_display_dots;
  }

  set setData(data: any[]) {
    this.data = data;
  }

  get getData() {
    return this.data;
  }

  get getTimer() {
    return this.timer;
  }

  set setTimer(timer: any) {
    this.timer = timer;
  }

  get getSpeed() {
    return this.speed;
  }

  set setSpeed(speed: number) {
    this.speed = speed;
  }

  create() {
    this.theCanvas = document.querySelector(this.selector);
    this.context = this.theCanvas.getContext("2d");
  }

  // INITIALLI
  init() {
    this.wait = 1;
    this.count = this.wait - 1;
    this.numToAddEachFrame = 4;

    //particle color
    this.r = 64;
    this.g = 158;
    this.b = 255;

    this.rgbString = "rgba(" + this.r + "," + this.g + "," + this.b + ","; //partial string for color which will be completed by appending alpha value.
    this.particleAlpha = 1; //maximum alpha

    this.displayWidth = this.theCanvas.width;
    this.displayHeight = this.theCanvas.height;

    this.fLen = 320; //represents the distance from the viewer to z=0 depth.

    //projection center coordinates sets location of origin
    this.projCenterX = this.displayWidth / 2;
    this.projCenterY = this.displayHeight / 2;

    //we will not draw coordinates if they have too large of a z-coordinate (which means they are very close to the observer).
    this.zMax = this.fLen - 2;

    this.particleList = {};
    this.recycleBin = {};

    //random acceleration factors - causes some random motion
    this.randAccelX = 0.1;
    this.randAccelY = 0.1;
    this.randAccelZ = 0.1;

    this.gravity = -0; //try changing to a positive number (not too large, for example 0.3), or negative for floating upwards.

    this.particleRad = 2.5;

    this.sphereCenterX = 0;
    this.sphereCenterY = 0;
    this.sphereCenterZ = -3 - this.sphereRad;

    //alpha values will lessen as particles move further back, causing depth-based darkening:
    this.zeroAlphaDepth = -750;

    this.turnSpeed = (2 * Math.PI) / (2400 / this.speed); //the sphere will rotate at this speed (one complete rotation every 1600 frames).
    this.turnAngle = 0; //initial angle

    this.timer = setInterval(() => {
      this.onTimer();
    }, 10 / 24);
  }

  onTimer() {
    this.turnSpeed = (2 * Math.PI) / (2400 / this.speed); //the sphere will rotate at this speed (one complete rotation every 1600 frames).
    //if enough time has elapsed, we will add new particles.
    this.count++;
    if (this.count >= this.wait) {
      this.count = 0;
      for (this.i = 0; this.i < this.numToAddEachFrame; this.i++) {
        this.theta = Math.random() * 2 * Math.PI;
        this.phi = Math.acos(Math.random() * 2 - 1);
        this.x0 = this.sphereRad * Math.sin(this.phi) * Math.cos(this.theta);
        this.y0 = this.sphereRad * Math.sin(this.phi) * Math.sin(this.theta);
        this.z0 = this.sphereRad * Math.cos(this.phi);

        //We use the addParticle function to add a new particle. The parameters set the position and velocity components.
        //Note that the velocity parameters will cause the particle to initially fly outwards away from the sphere center (after
        //it becomes unstuck).
        var p = this.addParticle(this.x0, this.sphereCenterY + this.y0, this.sphereCenterZ + this.z0, 0 * this.x0, 0 * this.y0, 0 * this.z0);

        //we set some "envelope" parameters which will control the evolving alpha of the particles.
        p.attack = 50;
        p.hold = 50;
        p.decay = 100;
        p.initValue = 0;
        p.holdValue = this.particleAlpha;
        p.lastValue = 0;

        //the particle will be stuck in one place until this time has elapsed:
        p.stuckTime = 90 + Math.random() * 20;

        p.accelX = 0;
        p.accelY = this.gravity;
        p.accelZ = 0;
      }
    }

    //update viewing angle
    this.turnAngle = (this.turnAngle + this.turnSpeed) % (2 * Math.PI);
    this.sinAngle = Math.sin(this.turnAngle);
    this.cosAngle = Math.cos(this.turnAngle);

    //background fill
    this.context.fillStyle = "rgb(36,36,36)";
    // context.clearColor(0, 0, 0, 0);
    this.context.fillRect(0, 0, this.displayWidth, this.displayHeight);
    //
    //update and draw particles
    p = this.particleList.first;
    while (p != null) {
      //before list is altered record next particle
      this.nextParticle = p.next;

      //update age
      p.age++;

      //if the particle is past its "stuck" time, it will begin to move.
      if (p.age > p.stuckTime) {
        p.velX += p.accelX + this.randAccelX * (Math.random() * 2 - 1);
        p.velY += p.accelY + this.randAccelY * (Math.random() * 2 - 1);
        p.velZ += p.accelZ + this.randAccelZ * (Math.random() * 2 - 1);

        p.x += p.velX;
        p.y += p.velY;
        p.z += p.velZ;
      }

      /*
        We are doing two things here to calculate display coordinates.
        The whole display is being rotated around a vertical axis, so we first calculate rotated coordinates for
        x and z (but the y coordinate will not change).
        Then, we take the new coordinates (rotX, y, rotZ), and project these onto the 2D view plane.
      */
      this.rotX = this.cosAngle * p.x + this.sinAngle * (p.z - this.sphereCenterZ);
      this.rotZ = -this.sinAngle * p.x + this.cosAngle * (p.z - this.sphereCenterZ) + this.sphereCenterZ;
      this.m = (this.radius_sp * this.fLen) / (this.fLen - this.rotZ);
      p.projX = this.rotX * this.m + this.projCenterX;
      p.projY = p.y * this.m + this.projCenterY;

      //update alpha according to envelope parameters.
      if (p.age < p.attack + p.hold + p.decay) {
        if (p.age < p.attack) {
          p.alpha = ((p.holdValue - p.initValue) / p.attack) * p.age + p.initValue;
        } else if (p.age < p.attack + p.hold) {
          p.alpha = p.holdValue;
        } else if (p.age < p.attack + p.hold + p.decay) {
          p.alpha = ((p.lastValue - p.holdValue) / p.decay) * (p.age - p.attack - p.hold) + p.holdValue;
        }
      } else {
        p.dead = true;
      }

      //see if the particle is still within the viewable range.
      if (p.projX > this.displayWidth || p.projX < 0 || p.projY < 0 || p.projY > this.displayHeight || this.rotZ > this.zMax) {
        this.outsideTest = true;
      } else {
        this.outsideTest = false;
      }

      if (this.outsideTest || p.dead) {
        this.recycle(p);
      } else {
        //depth-dependent darkening
        this.depthAlphaFactor = 1 - this.rotZ / this.zeroAlphaDepth;
        this.depthAlphaFactor = this.depthAlphaFactor > 1 ? 1 : this.depthAlphaFactor < 0 ? 0 : this.depthAlphaFactor;
        this.context.fillStyle = this.rgbString + this.depthAlphaFactor * p.alpha + ")";
        /*ADD TEXT function!*/
        /*ADD TEXT function!*/
        /*ADD TEXT function!*/
        /*ADD TEXT function!*/
        this.context.fillText(p.flake, p.projX, p.projY);
        this.context.font = "16px Verdana";
        /*ADD TEXT function!*/
        /*ADD TEXT function!*/
        /*ADD TEXT function!*/
        /*ADD TEXT function!*/
        //draw
        this.context.beginPath();
        if (this.opt_display_dots) {
          this.context.arc(p.projX, p.projY, this.m * this.particleRad, 0, 2 * Math.PI, false);
        }
        this.context.closePath();
        this.context.fill();
      }

      p = this.nextParticle;
    }
  }

  addParticle(x0: any, y0: any, z0: any, vx0: any, vy0: any, vz0: any) {
    var newParticle;
    var color;

    //check recycle bin for available drop:
    if (this.recycleBin.first != null) {
      newParticle = this.recycleBin.first;
      //remove from bin
      if (newParticle.next != null) {
        this.recycleBin.first = newParticle.next;
        newParticle.next.prev = null;
      } else {
        this.recycleBin.first = null;
      }
    }
    //if the recycle bin is empty, create a new particle (a new ampty object):
    else {
      newParticle = {};
    }

    //add to beginning of particle list
    if (this.particleList.first == null) {
      this.particleList.first = newParticle;
      newParticle.prev = null;
      newParticle.next = null;
    } else {
      newParticle.next = this.particleList.first;
      this.particleList.first.prev = newParticle;
      this.particleList.first = newParticle;
      newParticle.prev = null;
    }

    //initialize
    newParticle.x = x0;
    newParticle.y = y0;
    newParticle.z = z0;
    newParticle.velX = vx0;
    newParticle.velY = vy0;
    newParticle.velZ = vz0;
    newParticle.age = 0;
    newParticle.dead = false;

    if (this.data) {
      newParticle.flake = this.data[Math.floor(Math.random() * this.data.length)].姓名;
    }

    if (Math.random() < 0.5) {
      newParticle.right = true;
    } else {
      newParticle.right = false;
    }
    return newParticle;
  }

  recycle(p: any) {
    //remove from particleList
    if (this.particleList.first == p) {
      if (p.next != null) {
        p.next.prev = null;
        this.particleList.first = p.next;
      } else {
        this.particleList.first = null;
      }
    } else {
      if (p.next == null) {
        p.prev.next = null;
      } else {
        p.prev.next = p.next;
        p.next.prev = p.prev;
      }
    }
    //add to recycle bin
    if (this.recycleBin.first == null) {
      this.recycleBin.first = p;
      p.prev = null;
      p.next = null;
    } else {
      p.next = this.recycleBin.first;
      this.recycleBin.first.prev = p;
      this.recycleBin.first = p;
      p.prev = null;
    }
  }
}
