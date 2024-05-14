//TODO: issue with recording the jumping path


// Initialize globals
var spots = document.querySelectorAll(".pos");
let board = []; //2d representation of the game board
let mc = [[0, 1], [1, 1], [1, 0], [0, -1], [-1, -1], [-1, 0]]; //move coefficients
let numplayers = 2; //will be designated by user input (default 2 for testing)

// Loops to initialize 2D array elements.
for (let i = 0; i < 17; i++) {
   board[i] = [];
   for (let j = 0; j < 17; j++) {
      board[i][j] = "pos";
   }
}
for (let i = 0; i < 4; i++) {
   for (let j = 0; j < 4; j++) {
      board[i][j] = "n/a"
   }
}
for (let i = 13; i < 17; i++) {
   for (let j = 13; j < 17; j++) {
      board[i][j] = "n/a"
   }
}
for (let i = 5; i < 17; i++) {
   for (let j = 0; j < ((i < 8 || i > 12) ? i - 4 : 4); j++) {
      board[i][j] = "n/a"
   }
}
for (let i = 0; i < 12; i++) {
   for (let j = ((i < 4 || i > 8) ? i + 5 : 13); j < 17; j++) {
      board[i][j] = "n/a"
   }
}

spots.forEach(function (spot) {
   let location = spot.classList;
   spot.addEventListener("click", function () {
      if (spot.classList.contains("occupied")) {
         spot.classList.add("pos");
         spot.classList.remove("occupied");
         board[Number(location[0].slice(1, 3))][Number(location[1].slice(1, 3))] = "pos";
      } else {
         board[Number(location[0].slice(1, 3))][Number(location[1].slice(1, 3))] = "occupied";
         spot.classList.add("occupied");
         spot.classList.remove("pos");
         spot.classList.remove("opponent");
      }
   });
   spot.addEventListener("contextmenu", function (event) {
      event.preventDefault(); // Prevent the default context menu
      // Additional custom logic here
      if (spot.classList.contains("opponent")) {
         spot.classList.add("pos");
         spot.classList.remove("opponent");
         board[Number(location[0].slice(1, 3))][Number(location[1].slice(1, 3))] = "pos";
      } else {
         board[Number(location[0].slice(1, 3))][Number(location[1].slice(1, 3))] = "opponent";
         spot.classList.add("opponent");
         spot.classList.remove("pos");
         spot.classList.remove("occupied");
      }
   });
});

class Player {
   //constructor will need an extra parameter on final build (to choose which guy it is)
   constructor(translators) {
      this.translators = translators;
      this.pieces = [];
      this.p_board = [];
      for (let i = 0; i < 17; i++) {
         this.p_board[i] = [];
         for (let j = 0; j < 17; j++) {
            this.p_board[i][j] = "n/a";
         }
      }
      this.update_pboard(translators);
   }

   update_pboard(t) {
      //t: "translators" --> ensures each player's "perspective" is correct
      //p_board: "perspective board" --> the board according to each player's perspective
      for (let i = 0; i < 17; i++) {
         for (let j = 0; j < 17; j++) {
            let a_new = 8 * t[0] + i * t[1] + j * t[2];
            let b_new = 8 * t[3] + i * t[4] + j * t[5];
            if (!(a_new < 0 || a_new > 16 || b_new < 0 || b_new > 16)) {
               this.p_board[a_new][b_new] = board[i][j];
            }
         }
      }

      //basically we are "filling" the board so 
      let k = 0;
      for (let i = 0; i < 17; i++) {
         for (let j = 0; j < 17; j++) {
            if (this.p_board[i][j] == "occupied") {
               this.pieces[k] = [i, j];
               k++;
            }
         }
      }
   }

   turn() {
      this.update_pboard(this.translators);
      this.picky = true;
      this.best = 2; //we should always be able to get more than 2 in the next few moves
      //we can improve this concept later (taking median/mean of best possible future moves)
      this.curvalue = 0; //current value of move
      this.curmove = {
         'piece': 0,
         'dest': [0, 4],
         'path': [0]
      }; //current move you're looking at
      this.move = this.curmove; // corresponds to the "best" move you're looking at
      this.temp = this.p_board; //temp board to reflect intermediate moves
      this.tpieces = this.pieces //temp pieces to reflect intermediate moves
      this.analyze_moves(1);
      if (this.move.piece == 0 && this.move.dest[0] == 0 && this.move.dest[1] == 4) {
         console.log("trying again...")
         this.picky = false;
         this.best = 0;
         this.curvalue = 0;
         this.analyze_moves(1);
      }
      console.log(this.move);
   }

   analyze_moves(moveNum) {
      for (let piece = 0; piece < 10; piece++) {
         let position = this.tpieces[piece];
         let moves = [] // possible moves from this position
         //check if they exist and add if they do.
         //if they don't, check for jump
         //if jump, add the jump and then check for extra jumps
         for (let i = 0; i < 6; i++) {
            let a_0 = position[0]; //old a
            let a_1 = position[0] + mc[i][0]; //new a
            let b_0 = position[1];  //old b
            let b_1 = position[1] + mc[i][1]; //new b
            if (a_1 < 0 || a_1 > 16 || b_1 < 0 || b_1 > 16) {
               continue;
            }
            //check if the move is possible
            if (this.temp[a_1][b_1] == "pos") {
               //if it's possible add it to possible moves
               moves.push({
                  'piece': piece,
                  'dest': [a_1, b_1],
                  'path': [i]
               });
               if (moveNum == 1) {
                  this.curmove = moves.at(moves.length - 1);
               }
               let value = a_1 - a_0; //positive vertical progress
               this.curvalue += value * (0.9 ** ((moveNum - 1) * (numplayers - 1))); //basic accounting for opponent blocks (can improve later)
               if (moveNum < 3) {
                  this.temp[a_0][b_0] = "pos";
                  this.temp[a_1][b_1] = "occupied";
                  this.tpieces[piece] = [a_1, b_1];
                  if (this.promising(moveNum)) {
                     this.analyze_moves(moveNum + 1);
                  }
                  this.tpieces[piece] = [a_0, b_0];
                  this.temp[a_0][b_0] = "occupied";
                  this.temp[a_1][b_1] = "pos";
                  this.curvalue -= value * (0.9 ** ((moveNum - 1) * (numplayers - 1)));
               } else {
                  if (this.curvalue > this.best) {
                     this.best = this.curvalue;
                     this.move = this.curmove;
                  }
                  this.curvalue -= value * (0.9 ** ((moveNum - 1) * (numplayers - 1)));
               }
            } else if (this.temp[a_1][b_1] != "n/a") {
               if (position[0] + 2 * mc[i][0] < 0 || position[0] + 2 * mc[i][0] > 16 || position[1] + 2 * mc[i][1] < 0 || position[1] + 2 * mc[i][1] > 16) {
                  continue;
               }
               //if there is a piece adjacent to you, check if you can hop it
               if (this.temp[position[0] + 2 * mc[i][0]][position[1] + 2 * mc[i][1]] == "pos") {
                  //enter a recursive jump sequence if you can hop it
                  this.jump(moves, piece, [position[0] + 2 * mc[i][0], position[1] + 2 * mc[i][1]], [i], moveNum)
               }
            }
         }
      }
   }

   promising(moveNum) {
      if (this.picky) {
         switch (moveNum) {
            case (1): return this.curvalue >= 0;
            case (2): return this.curvalue >= 2 * (0.9 ** (numplayers - 1));
         }
      } else {
         return this.curvalue >= -1;
      }
   }

   jump(moves, piece, position, path_in, moveNum) {
      let path = []; //pass array by value
      for (let i = 0; i < path_in.length; i++) {
         path.push(path_in[i]);
      }
      //add this jump to the possible moves
      moves.push({
         'piece': piece,
         'dest': position,
         'path': path
      });
      if (moveNum == 1) {
         this.curmove = moves.at(moves.length - 1);
      }
      let a_0 = this.tpieces[piece][0]; //old a
      let a_1 = position[0]; //new a
      let b_0 = this.tpieces[piece][1]; //old b
      let b_1 = position[1];  //new b
      let value = a_1 - a_0; //positive vertical progress
      this.curvalue += value * (0.9 ** ((moveNum - 1) * (numplayers - 1))); //basic accounting for opponent blocks (can improve later)
      if (moveNum < 3) {
         this.temp[a_0][b_0] = "pos";
         this.temp[a_1][b_1] = "occupied";
         this.tpieces[piece] = [a_1, b_1];
         if (this.promising(moveNum)) {
            this.analyze_moves(moveNum + 1);
         }
         this.tpieces[piece] = [a_0, b_0];
         this.temp[a_0][b_0] = "occupied";
         this.temp[a_1][b_1] = "pos";
         this.curvalue -= value * (0.9 ** ((moveNum - 1) * (numplayers - 1)));
      } else {
         if (this.curvalue > this.best) {
            this.best = this.curvalue;
            this.move = this.curmove;
         }
         this.curvalue -= value * (0.9 ** ((moveNum - 1) * (numplayers - 1)));
      }
      for (let i = 0; i < 6; i++) {
         if (position[0] + mc[i][0] < 0 || position[0] + mc[i][0] > 16 || position[1] + mc[i][1] < 0 || position[1] + mc[i][1] > 16) {
            continue;
         }
         let adjacent = this.temp[position[0] + mc[i][0]][position[1] + mc[i][1]];
         let hopped = [position[0] + 2 * mc[i][0], position[1] + 2 * mc[i][1]];
         if (hopped[0] < 0 || hopped[0] > 16 || hopped[1] < 0 || hopped[1] > 16) {
            continue;
         }
         //if there is a piece adjacent to you, check if you can hop it
         if (adjacent != "n/a" && adjacent != "pos") {
            //the destination must be valid and cannot be contained already in the possible moves
            if (this.temp[hopped[0]][hopped[1]] == "pos" && this.unvisited(moves, hopped)) {
               path.push(i);
               this.jump(moves, piece, [position[0] + 2 * mc[i][0], position[1] + 2 * mc[i][1]], path, moveNum);
               path.pop(i);
            }
         }
      }
   }

   unvisited(moves, hopped) {
      for (let i = 0; i < moves.length; i++) {
         if (moves[i].dest[0] == hopped[0] && moves[i].dest[1] == hopped[1]) {
            return false;
         }
      }
      return true;
   }

}

document.getElementById("test-run").addEventListener("click", function () {
   const player = new Player([0, 1, 0, 0, 0, 1]);
   console.log("board:", player.p_board);
   console.log("pieces:", player.pieces);
   player.turn();
});
