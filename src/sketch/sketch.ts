let players = [];
let leftSidePlayers = [];
let rightSidePlayers = [];

let disc;


const sketchFunction = (s: p5) => {


  s.setup = () => {
    let canvas = s.createCanvas(768, 768);
    canvas.parent('canvasContainer');

    disc = new Disc(s);

    s.select('#accelerateButton').mousePressed(() => disc.accelerate());
    s.select('#stopButton').mousePressed(() => disc.stop());
    // Clear button click event
    s.select('#clearWheel').mousePressed(() => {
      players = [];
      leftSidePlayers = [];
      rightSidePlayers = [];
      disc = new Disc(s);
      s.select('#left-side-team').html(`<div>Team 1</div>`)
      s.select('#right-side-team').html(`<div>Team 2</div>`)
    });

    function addNewPlayer() {
      let playerName = s.select('#playerInput').value();
      if (playerName) {
        if (typeof playerName === "string") {
          let newPlayers = playerName.split("\n").forEach((newPlayerName) => {
            newPlayerName = newPlayerName.trim()
            if (newPlayerName !== "" && players.filter((playerName) => { return playerName.toLowerCase() === newPlayerName.toLowerCase() }).length == 0) {
              players.push(newPlayerName);
              disc.addPlayer(newPlayerName);
            }
          })
        }
        s.select('#playerInput').value('');
      }


    }
    players = ["Eric", "Shaun", "Jonathan", "Kim", "Justin", "Nick", "Emily", "Bob", "Frank"]
    players.forEach(player => disc.addPlayer(player));

    document.getElementById("playerInput").addEventListener("keyup", (event) => {
      if (event.key == "Enter")
        addNewPlayer()
    })

    // Add player button click event
    s.select('#addPlayer').mousePressed(() => {
      addNewPlayer()
    });
  }

  s.draw = () => {
    s.background(200);

    // draw rectangles for left and right halves
    s.fill(0, 128, 0); // color for left half, adjust as needed
    s.rect(0, 0, s.width / 2, s.height);
    s.fill(128, 0, 128); // color for right half, adjust as needed
    s.rect(s.width / 2, 0, s.width / 2, s.height);

    disc.display();
    disc.spin();
  }
}

new p5(sketchFunction)


class Disc {
  private angleChange: number = 0.00; // Add this line
  constructor(private sketch: p5, private angle: number = 0, private playerWedges = []) {
  }

  addPlayer(name: string) {
    this.playerWedges.push(new PlayerWedge(this.sketch, name, this.playerWedges.length, (2 * Math.PI) / this.playerWedges.length));
    this.playerWedges.forEach((wedge, index) => {
      wedge.setAngle((2 * Math.PI) / this.playerWedges.length);
    });
  }

  display() {
    let s = this.sketch;
    s.push();
    s.translate(s.width / 2, s.height / 2);
    s.rotate(this.angle);
    this.playerWedges.forEach(wedge => {
      wedge.display();
    });
    s.pop();
  }

  accelerate() {
    this.angleChange += 0.02;
    let spinSound = (this.sketch.select("#spinSound") as unknown as HTMLAudioElement)
    spinSound.currentTime=0;
    spinSound.play()
  }

  stop() {
    this.playerWedges.forEach(wedge => wedge.flyOff(this.angleChange));
    
    let spinSound = (this.sketch.select("#spinSound") as unknown as HTMLAudioElement)
    spinSound.pause();

    let stopWheelSound = (this.sketch.select("#stopWheelSound") as unknown as HTMLAudioElement)
    stopWheelSound.play()
    
    setTimeout(() => {
      this.dividePlayers();
      this.displayPlayersList();
    }, 100)
    this.angleChange = 0;
  }

  spin() {
    this.angle += this.angleChange;
  }

  displayPlayersList() {
    let s = this.sketch;
      // Display the player lists
      s.fill(255);
      s.text('Left side:', 10, 10);
      for (let i = 0; i < leftSidePlayers.length; i++) {
        s.text(leftSidePlayers[i], 10, 30 + i * 20);
        s.select('#left-side-team').html(`<div>${leftSidePlayers[i]}</div>`, true)
      }

      s.text('Right side:', s.width / 2 + 10, 10);
      for (let i = 0; i < rightSidePlayers.length; i++) {
        s.text(rightSidePlayers[i], s.width / 2 + 10, 30 + i * 20);
        s.select('#right-side-team').html(`<div>${rightSidePlayers[i]}</div>`, true)
      }
  }

  dividePlayers() {
    this.playerWedges.forEach(wedge => {
      // Add discAngle to the wedge's angle
      let angle = Math.atan2(wedge.velocity.y, wedge.velocity.x) + this.angle;

      // Make sure the angle is between -PI and PI
      angle = (angle + 3 * Math.PI) % (2 * Math.PI) - Math.PI;

      if (angle > -Math.PI / 2 && angle < Math.PI / 2) {
        rightSidePlayers.push(wedge.name);
      } else {
        leftSidePlayers.push(wedge.name);
      }
    });
  }



}

class PlayerWedge {
  public position: p5.Vector;
  public velocity: p5.Vector;
  private color: p5.Color;
  public startAngle: number;

  constructor(private sketch: p5, public name: string, public index: number, public angle: number) {
    this.color = this.sketch.color(this.sketch.random(255), this.sketch.random(255), this.sketch.random(255));
    this.startAngle = this.index * this.angle;  // The starting angle of each wedge should be the stopping angle of the previous one.


    // Initialize position at the center of the canvas
    this.position = this.sketch.createVector(0, 0);
  }

  flyOff(discSpeed: number) {
    let direction = p5.Vector.fromAngle(this.startAngle + this.angle / 2);
    this.velocity = direction.mult(discSpeed * 20);
  }

  update() {
    if (this.velocity) {
      // this.startAngle += this.velocity.mag();
      this.velocity.mult(1 - 0.02)
    }

    // Update position according to velocity
    if (this.velocity) {
      this.position.add(this.velocity);
    }
  }
  setAngle(angle: number) {
    this.angle = angle;
    this.startAngle = this.index * this.angle;  // Update the starting angle as well whenever the angle changes.
  }

  display() {
    const s = this.sketch;
    s.angleMode(s.RADIANS);
    s.fill(this.color);

    // Translate to the current position of the wedge
    s.push();
    s.translate(this.position.x, this.position.y);

    // Draw the wedge
    s.arc(0, 0, 400, 400, this.startAngle, this.startAngle + this.angle, s.PIE);

    // Rotate and draw the text
    s.rotate(this.startAngle + this.angle / 2);
    s.translate(100, 7); // Modify this value to adjust the distance of the text from the center of the wedge
    s.textAlign(s.CENTER);

    // calculate brightness
    let brightness = s.red(this.color) * 0.299 + s.green(this.color) * 0.587 + s.blue(this.color) * 0.114;
    if (brightness > 128) {  // brightness threshold, adjust as needed
      s.fill(0);  // use black text for light colors
    } else {
      s.fill(255);  // use white text for dark colors
    }
    s.text(this.name, 0, 0);

    s.pop();

    this.update();
  }

}
