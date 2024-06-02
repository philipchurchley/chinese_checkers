// Initialize globals
let board = []; //2d representation of the game board
const mc = [[0, 1], [1, 1], [1, 0], [0, -1], [-1, -1], [-1, 0]]; //move coefficients
let numplayers = 2; //will be designated by user input (default 2 for testing)
let max = 300;

const TRANS = [
   [0, 1, 0, 0, 0, 1],
   [1, 1, -1, 0, 1, 0],
   [2, 0, -1, 2, -1, 0],
   [2, -1, 0, 2, 0, -1],
   [1, -1, 1, 2, -1, 0],
   [0, 0, 1, 0, 1, 0],
   [0, 1, 0, 0, 0, 1],
   [0, 0, 1, 1, -1, 1], //fix ?
   [2, 0, -1, 2, -1, 0],
   [2, -1, 0, 2, 0, -1],
   [2, 0, -1, 1, 1, -1], //fix ?
   [0, 0, 1, 0, 1, 0]
]

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

class Player {
   constructor(name_in) {
      this.name = name_in
      this.index = Number(name_in.slice(1, 2))
      this.win = false;
      this.pieces = new Array(10);
      this.p_board = [];
      for (let i = 0; i < 17; i++) {
         this.p_board[i] = [];
         for (let j = 0; j < 17; j++) {
            this.p_board[i][j] = "n/a";
         }
      }
   }

   update_pboard(board_in) {
      //t: "translators" --> ensures each player's "perspective" is correct
      //p_board: "perspective board" --> the board according to each player's perspective
      let t = TRANS[this.index];
      for (let i = 0; i < 17; i++) {
         for (let j = 0; j < 17; j++) {
            let a_new = 8 * t[0] + i * t[1] + j * t[2];
            let b_new = 8 * t[3] + i * t[4] + j * t[5];
            if (!(a_new < 0 || a_new > 16 || b_new < 0 || b_new > 16)) {
               this.p_board[a_new][b_new] = board_in[i][j];
            }
         }
      }

      //basically we are "filling" the board so 
      let k = 0;
      for (let i = 0; i < 17; i++) {
         for (let j = 0; j < 17; j++) {
            if (this.p_board[i][j] === this.name) {
               this.pieces[k] = [i, j];
               k++;
            }
         }
      }
   }
}

class Bot extends Player {
   constructor(name_in) {
      super(name_in);
   }

   turn(board_in_string) {
      const board_in = JSON.parse(board_in_string);
      super.update_pboard(board_in);
      this.picky = true;
      this.best = 2; //we should always be able to get more than 2 in the next few moves
      //we can improve this concept later (taking median/mean of best possible future moves)
      this.curvalue = 0; //current value of move
      this.curmove = {
         'piece': 0,
         'dest': [0, 4],
         'path': [0]
      }; //current move you're looking at
      //deep copies:
      this.move = JSON.parse(JSON.stringify(this.curmove)); // corresponds to the "best" move you're looking at
      this.temp = JSON.parse(JSON.stringify(this.p_board)); //temp board to reflect intermediate moves
      this.tpieces = JSON.parse(JSON.stringify(this.pieces)); //temp pieces to reflect intermediate moves
      this.analyze_moves(1);
      if (this.move.piece === 0 && this.move.dest[0] === 0 && this.move.dest[1] === 4) {
         this.picky = false;
         this.best = 0;
         this.curvalue = 0;
         this.analyze_moves(1);
      }
      if (this.move.piece === 0 && this.move.dest[0] === 0 && this.move.dest[1] === 4) {
         this.best = -10;
         this.analyze_moves(1);
      }
      console.log(this.best)
      return this.move;
   }

   otherHome(a, b) {
      for (let i = 0; i < 17; i++) {
         if (i >= 0 && i < 4) {
            if (b === i) {
               return true;
            }
         } else if (i >= 4 && i < 8) {
            if (b === i && a > i + 4) {
               return true;
            }
         } else if (i >= 9 && i < 13) {
            if (b === i && a < i - 4) {
               return true;
            }
         } else if (i >= 13) {
            if (b === i) {
               return true;
            }
         }
      }
      return false;
   }

   yourHome(loc) {
      return (loc[0] < 4 && loc[1] < (loc[0] + 5));
   }

   analyze_moves(moveNum) {
      for (let piece = 0; piece < 10; piece++) {
         let position = this.tpieces[piece];
         let moves = [] // possible moves from this position
         //check if they exist and add if they do.
         //if they don't, check for jump
         //if jump, add the jump and then check for extra jumps
         if (this.yourHome(this.pieces[piece]) && moveNum == 1) { //this if statement is intended to encourage you to evacuate your home
            this.curvalue += 0.5;
         }
         for (let i = 0; i < 6; i++) {
            let a_0 = position[0]; //old a
            let a_1 = position[0] + mc[i][0]; //new a
            let b_0 = position[1];  //old b
            let b_1 = position[1] + mc[i][1]; //new b
            if (a_1 < 0 || a_1 > 16 || b_1 < 0 || b_1 > 16) {
               continue;
            }
            if (this.otherHome(a_1, b_1)) {
               continue;
            }
            //check if the move is possible
            if (this.temp[a_1][b_1] === "pos") {
               //if it's possible add it to possible moves
               moves.push({
                  'piece': piece,
                  'dest': [a_1, b_1],
                  'path': [i]
               });
               if (moveNum === 1) {
                  this.curmove = moves.at(moves.length - 1);
               }
               let value = a_1 - a_0; //positive vertical progress
               this.curvalue += value * (0.9 ** ((moveNum - 1) * (numplayers - 1))); //basic accounting for opponent blocks (can improve later)
               if (moveNum < 3) {
                  this.temp[a_0][b_0] = "pos";
                  this.temp[a_1][b_1] = this.name;
                  this.tpieces[piece] = [a_1, b_1];
                  if (this.promising(moveNum)) {
                     this.analyze_moves(moveNum + 1);
                  }
                  this.tpieces[piece] = [a_0, b_0];
                  this.temp[a_0][b_0] = this.name;
                  this.temp[a_1][b_1] = "pos";
               } else {
                  if (this.curvalue > this.best) {
                     console.log('here')
                     this.best = this.curvalue;
                     this.move = this.curmove;
                  }
               }
               this.curvalue -= value * (0.9 ** ((moveNum - 1) * (numplayers - 1)));
            } else if (this.temp[a_1][b_1] != "n/a") {
               if (position[0] + 2 * mc[i][0] < 0 || position[0] + 2 * mc[i][0] > 16 || position[1] + 2 * mc[i][1] < 0 || position[1] + 2 * mc[i][1] > 16) {
                  continue;
               }
               if (this.otherHome(position[0] + 2 * mc[i][0], position[1] + 2 * mc[i][1])) {
                  continue;
               }
               //if there is a piece adjacent to you, check if you can hop it
               if (this.temp[position[0] + 2 * mc[i][0]][position[1] + 2 * mc[i][1]] === "pos") {
                  //enter a recursive jump sequence if you can hop it
                  this.jump(moves, piece, [position[0] + 2 * mc[i][0], position[1] + 2 * mc[i][1]], [i], moveNum)
               }
            }
         }
         if (this.yourHome(this.pieces[piece]) && moveNum == 1) { //this if statement is intended to encourage you to evacuate your home
            this.curvalue -= 0.5;
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
         return true;
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
         'dest': JSON.parse(JSON.stringify(position)), //deep copy
         'path': path
      });
      if (moveNum === 1) {
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
         this.temp[a_1][b_1] = this.name;
         this.tpieces[piece] = [a_1, b_1];
         if (this.promising(moveNum)) {
            this.analyze_moves(moveNum + 1);
         }
         this.tpieces[piece] = [a_0, b_0];
         this.temp[a_0][b_0] = this.name;
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
         if (this.otherHome(position[0] + 2 * mc[i][0], position[1] + 2 * mc[i][1])) {
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
            if (this.temp[hopped[0]][hopped[1]] === "pos" && this.unvisited(moves, hopped)) {
               path.push(i);
               this.jump(moves, piece, [position[0] + 2 * mc[i][0], position[1] + 2 * mc[i][1]], path, moveNum);
               path.pop(i);
            }
         }
      }
   }

   unvisited(moves, hopped) {
      for (let i = 0; i < moves.length; i++) {
         if (moves[i].dest[0] === hopped[0] && moves[i].dest[1] === hopped[1]) {
            return false;
         }
      }
      return true;
   }

};

////////////////////////////////////////////////////////////////////////////////////////////////////

class Human extends Player {
   constructor(name_in) {
      super(name_in);
   }

   turn(board_in) {
      super.update_pboard(JSON.parse(board_in));
      return false;
   }
}

//not a player
class Nap extends Player {
   constructor(name_in) {
      super(name_in);
   }

   turn() {
      return false;
   }
}

////////////////////////////////////////////////////////////////////////////////////////////////////

function Spot(props) {
   return (
      <button
         className={props.value}
         onClick={props.onClick}
      >
         {"" + props.location[0] + " " + props.location[1]}
      </button>
   );
}

class Board extends React.Component {
   constructor(props) {
      super(props);
      this.state = {
         spots: JSON.parse(JSON.stringify(board)),
         turn: 0,
      }
   }

   playerFactory(playerType, tindex, name_in) {
      let t = TRANS[6 + tindex];
      const spots = JSON.parse(JSON.stringify(this.state.spots));
      for (let i = 0; i < 4; i++) {
         for (let j = 4; j < i + 5; j++) {
            let a_new = 8 * t[0] + i * t[1] + j * t[2];
            let b_new = 8 * t[3] + i * t[4] + j * t[5];
            if (playerType === "Empty")
               spots[a_new][b_new] = "pos";
            else
               spots[a_new][b_new] = name_in;
         }
      }
      this.state.spots = spots;
      switch (playerType) {
         case ("Empty"): return new Nap(name_in);
         case ("Player"): { numplayers++; return new Human(name_in); }
         case ("Bot"): { numplayers++; return new Bot(name_in); }
      }
   }

   handleClick(a, b) {
      /*
      const squares = this.state.squares.slice();
      if (calculateWinner(squares) || squares[i]) {
         return;
      }
      squares[i] = this.state.xIsNext ? 'X' : 'O';
      this.setState({
         squares: squares,
         xIsNext: !this.state.xIsNext,
      });
      */
   }

   renderSpots(a, b) {
      return (
         <Spot
            value={this.state.spots[a][b]}
            location={[a, b]}
            onClick={() => this.handleClick(a, b)}
         />
      );
   }

   bot_move(index, move) {
      const spots = JSON.parse(JSON.stringify(this.state.spots));
      const x = this.Players[index].pieces[move.piece];
      let t = TRANS[index + 6];
      let x1 = 8 * t[0] + x[0] * t[1] + x[1] * t[2];
      let x2 = 8 * t[3] + x[0] * t[4] + x[1] * t[5];
      spots[x1][x2] = "pos";
      //add some sorta animation here somehow
      const y = move.dest;
      let y1 = 8 * t[0] + y[0] * t[1] + y[1] * t[2];
      let y2 = 8 * t[3] + y[0] * t[4] + y[1] * t[5];
      spots[y1][y2] = this.Players[index].name
      this.state.spots = spots;
   }

   human_move(index) {

   }

   winner(index) {
      let t = TRANS[index + 6];
      for (let i = 13; i < 17; i++) {
         for (let j = i - 4; j < 13; j++) {
            let x1 = 8 * t[0] + i * t[1] + j * t[2];
            let x2 = 8 * t[3] + i * t[4] + j * t[5];
            if (this.state.spots[x1][x2] != this.Players[index].name) {
               return false;
            }
         }
      }
      return true;
   }

   run() {
      max += 6
      numplayers = 0;
      this.state.spots = JSON.parse(JSON.stringify(board));
      this.state.turn = 0;
      this.Players = new Array(6);
      this.Players[0] = this.playerFactory(document.getElementById("p1").value, 0, "p0");
      this.Players[1] = this.playerFactory(document.getElementById("p2").value, 1, "p1");
      this.Players[2] = this.playerFactory(document.getElementById("p3").value, 2, "p2");
      this.Players[3] = this.playerFactory(document.getElementById("p4").value, 3, "p3");
      this.Players[4] = this.playerFactory(document.getElementById("p5").value, 4, "p4");
      this.Players[5] = this.playerFactory(document.getElementById("p6").value, 5, "p5");
      this.setState({
         spots: this.state.spots,
         turn: this.state.turn,
      });
      numplayers = (numplayers <= 1) ? 2 : numplayers;
      let index = 5;
      let x = 0;
      //put some sorta promise thing here so that user can update board for each turn
      while (!this.winner(index)) {
         x++
         if (x > max) {
            break;
         }
         index = (index + 1) % 6;
         this.state.turn = index;
         let move = this.Players[index].turn(JSON.stringify(this.state.spots));
         if (move) {
            this.bot_move(index, move);
            console.log(index, move, x);
         } else if (this.Players[index].constructor.name === 'Human') {
            this.human_move(index);
         }
      }
      index++;
      this.setState({
         spots: this.state.spots,
         turn: this.state.turn,
      });
      alert("player" + index + " wins! " + x);
   }

   execute_turn() {
      //   while (!(this.Players[this.state.turn].constructor.name === 'Human')) {
      //      let move = this.Players[this.state.turn].turn(JSON.stringify(this.state.spots));
      //      if (move) {
      //         this.bot_move(this.state.turn, move); //this would be a good place to insert some sorta animation
      //      }
      //      index = (index + 1) % 6;
      //   }
   }

   render() {
      return (
         <>
            <button onClick={() => this.run()}>run</button>
            <p>Player {this.state.turn + 1}'s turn</p>
            <div class="game-board">
               <div class="row">
                  {this.renderSpots(16, 12)}
               </div>
               <div class="row">
                  {this.renderSpots(15, 11)}
                  {this.renderSpots(15, 12)}
               </div>
               <div class="row">
                  {this.renderSpots(14, 10)}
                  {this.renderSpots(14, 11)}
                  {this.renderSpots(14, 12)}
               </div>
               <div class="row">
                  {this.renderSpots(13, 9)}
                  {this.renderSpots(13, 10)}
                  {this.renderSpots(13, 11)}
                  {this.renderSpots(13, 12)}
               </div>
               <div class="row">
                  {this.renderSpots(12, 4)}
                  {this.renderSpots(12, 5)}
                  {this.renderSpots(12, 6)}
                  {this.renderSpots(12, 7)}
                  {this.renderSpots(12, 8)}
                  {this.renderSpots(12, 9)}
                  {this.renderSpots(12, 10)}
                  {this.renderSpots(12, 11)}
                  {this.renderSpots(12, 12)}
                  {this.renderSpots(12, 13)}
                  {this.renderSpots(12, 14)}
                  {this.renderSpots(12, 15)}
                  {this.renderSpots(12, 16)}
               </div>
               <div class="row">
                  {this.renderSpots(11, 4)}
                  {this.renderSpots(11, 5)}
                  {this.renderSpots(11, 6)}
                  {this.renderSpots(11, 7)}
                  {this.renderSpots(11, 8)}
                  {this.renderSpots(11, 9)}
                  {this.renderSpots(11, 10)}
                  {this.renderSpots(11, 11)}
                  {this.renderSpots(11, 12)}
                  {this.renderSpots(11, 13)}
                  {this.renderSpots(11, 14)}
                  {this.renderSpots(11, 15)}
               </div>
               <div class="row">
                  {this.renderSpots(10, 4)}
                  {this.renderSpots(10, 5)}
                  {this.renderSpots(10, 6)}
                  {this.renderSpots(10, 7)}
                  {this.renderSpots(10, 8)}
                  {this.renderSpots(10, 9)}
                  {this.renderSpots(10, 10)}
                  {this.renderSpots(10, 11)}
                  {this.renderSpots(10, 12)}
                  {this.renderSpots(10, 13)}
                  {this.renderSpots(10, 14)}
               </div>
               <div class="row">
                  {this.renderSpots(9, 4)}
                  {this.renderSpots(9, 5)}
                  {this.renderSpots(9, 6)}
                  {this.renderSpots(9, 7)}
                  {this.renderSpots(9, 8)}
                  {this.renderSpots(9, 9)}
                  {this.renderSpots(9, 10)}
                  {this.renderSpots(9, 11)}
                  {this.renderSpots(9, 12)}
                  {this.renderSpots(9, 13)}
               </div>
               <div class="row">
                  {this.renderSpots(8, 4)}
                  {this.renderSpots(8, 5)}
                  {this.renderSpots(8, 6)}
                  {this.renderSpots(8, 7)}
                  {this.renderSpots(8, 8)}
                  {this.renderSpots(8, 9)}
                  {this.renderSpots(8, 10)}
                  {this.renderSpots(8, 11)}
                  {this.renderSpots(8, 12)}
               </div>
               <div class="row">
                  {this.renderSpots(7, 3)}
                  {this.renderSpots(7, 4)}
                  {this.renderSpots(7, 5)}
                  {this.renderSpots(7, 6)}
                  {this.renderSpots(7, 7)}
                  {this.renderSpots(7, 8)}
                  {this.renderSpots(7, 9)}
                  {this.renderSpots(7, 10)}
                  {this.renderSpots(7, 11)}
                  {this.renderSpots(7, 12)}
               </div>
               <div class="row">
                  {this.renderSpots(6, 2)}
                  {this.renderSpots(6, 3)}
                  {this.renderSpots(6, 4)}
                  {this.renderSpots(6, 5)}
                  {this.renderSpots(6, 6)}
                  {this.renderSpots(6, 7)}
                  {this.renderSpots(6, 8)}
                  {this.renderSpots(6, 9)}
                  {this.renderSpots(6, 10)}
                  {this.renderSpots(6, 11)}
                  {this.renderSpots(6, 12)}
               </div>
               <div class="row">
                  {this.renderSpots(5, 1)}
                  {this.renderSpots(5, 2)}
                  {this.renderSpots(5, 3)}
                  {this.renderSpots(5, 4)}
                  {this.renderSpots(5, 5)}
                  {this.renderSpots(5, 6)}
                  {this.renderSpots(5, 7)}
                  {this.renderSpots(5, 8)}
                  {this.renderSpots(5, 9)}
                  {this.renderSpots(5, 10)}
                  {this.renderSpots(5, 11)}
                  {this.renderSpots(5, 12)}
               </div>
               <div class="row">
                  {this.renderSpots(4, 0)}
                  {this.renderSpots(4, 1)}
                  {this.renderSpots(4, 2)}
                  {this.renderSpots(4, 3)}
                  {this.renderSpots(4, 4)}
                  {this.renderSpots(4, 5)}
                  {this.renderSpots(4, 6)}
                  {this.renderSpots(4, 7)}
                  {this.renderSpots(4, 8)}
                  {this.renderSpots(4, 9)}
                  {this.renderSpots(4, 10)}
                  {this.renderSpots(4, 11)}
                  {this.renderSpots(4, 12)}
               </div>
               <div class="row">
                  {this.renderSpots(3, 4)}
                  {this.renderSpots(3, 5)}
                  {this.renderSpots(3, 6)}
                  {this.renderSpots(3, 7)}
               </div>
               <div class="row">
                  {this.renderSpots(2, 4)}
                  {this.renderSpots(2, 5)}
                  {this.renderSpots(2, 6)}
               </div>
               <div class="row">
                  {this.renderSpots(1, 4)}
                  {this.renderSpots(1, 5)}
               </div>
               <div class="row">
                  {this.renderSpots(0, 4)}
               </div>
            </div>
            <button onClick={() => this.execute_turn()}>{"Complete Player " + (this.state.turn + 1) + "'s turn"}</button>
         </>
      );
   }
}
