// Initialize globals
let board = []; //2d representation of the game board
const mc = [[0, 1], [1, 1], [1, 0], [0, -1], [-1, -1], [-1, 0]]; //move coefficients
let numplayers = 2; //will be designated by user input (default 2 for testing)
let max = 300;
const SPEED = 500;

const TRANS = [
   [0, 1, 0, 0, 0, 1],
   [1, 1, -1, 0, 1, 0],
   [2, 0, -1, 2, -1, 0],
   [2, -1, 0, 2, 0, -1],
   [1, -1, 1, 2, -1, 0],
   [0, 0, 1, 0, 1, 0],
   //^--real to p  v-- p to real
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
               //to make sure you are keeping your pieces relatively close together
               if (piece === 0) {
                  value += (this.pieces[7][0] - this.pieces[0][0] > 6) ? (this.pieces[7][0] - this.pieces[0][0]) / 5 : 0;
               }
               this.curvalue += value * (0.9 ** ((moveNum - 1) * (numplayers - 1))); //basic accounting for opponent blocks (can improve later)
               if (moveNum < 3) {
                  this.temp[a_0][b_0] = "pos";
                  this.temp[a_1][b_1] = this.name;
                  this.tpieces[piece] = [a_1, b_1];
                  if (this.winner()) {
                     this.curvalue += 15 * (4 - moveNum); // severely incentivises WINNING asap
                  }
                  //////////////////////////////////////////////////////////////////////////////
                  if (this.promising(moveNum)) {
                     this.analyze_moves(moveNum + 1);
                  }
                  //////////////////////////////////////////////////////////////////////////////
                  if (this.winner()) {
                     this.curvalue -= 15 * (4 - moveNum); // severely incentivises WINNING asap
                  }
                  this.tpieces[piece] = [a_0, b_0];
                  this.temp[a_0][b_0] = this.name;
                  this.temp[a_1][b_1] = "pos";
               } else {
                  this.temp[a_0][b_0] = "pos";
                  this.temp[a_1][b_1] = this.name;
                  if (this.winner()) {
                     this.curvalue += 15 * (4 - moveNum); // severely incentivises WINNING asap
                  }
                  ///////////////////////////////////////////////////////////////////////////
                  if (this.curvalue > this.best) {
                     this.best = this.curvalue;
                     this.move = this.curmove;
                  }
                  /////////////////////////////////////////////////////////////////////////////
                  if (this.winner()) {
                     this.curvalue -= 15 * (4 - moveNum); // severely incentivises WINNING asap
                  }
                  this.temp[a_0][b_0] = this.name;
                  this.temp[a_1][b_1] = "pos";
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
      if (piece === 0) {
         value += (this.pieces[7][0] - this.pieces[0][0] > 6) ? (this.pieces[7][0] - this.pieces[0][0]) / 4 : 0;
      }
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

   winner() {
      for (let i = 13; i < 17; i++) {
         for (let j = i - 4; j < 13; j++) {
            if (this.temp[i][j] != this.name) {
               return false;
            }
         }
      }
      console.log('true! ' + this.index);
      return true;
   }
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


const moveStates = Object.freeze({
   UNMOVED: 'unmoved',
   SLID: 'slid',
   JUMPING: 'jumping'
});

class Human extends Player {
   constructor(name_in) {
      super(name_in);
      super.update_pboard(JSON.parse(JSON.stringify(this.p_board)));
      this.index = 0; //BIG DIFFERENCE BTWN PLAYERS AND BOTS (players don't have false perspectives)
   }

   turn(board_in) {
      super.update_pboard(JSON.parse(board_in));
      this.move = {
         piece: -1,
         state: moveStates.UNMOVED,

      }
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

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Spot(props) {
   return (
      <button
         className={props.value}
         name={'[' + props.location[0] + ',' + props.location[1] + ']'} //string of location array, personally I think to be pretty clever
         onClick={props.onClick}
      >
      </button>
   );
}

//{ "" + props.location[0] + " " + props.location[1] }

class Board extends React.Component {
   constructor(props) {
      super(props);
      this.state = {
         spots: JSON.parse(JSON.stringify(board)),
         turn: 0,
      }
   }

   componentDidMount() {
      document.querySelector('.game-board').style.display = 'none';
      document.querySelector('.turnsign').style.display = 'none';
      document.querySelector('.execute').style.display = 'none';
      document.querySelector('.winner').style.display = 'none';
      document.querySelector('#error').style.display = 'none';
      document.querySelector('.selection-menu').style.display = 'flex';
      document.querySelector('.run').style.display = 'block';
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

   highlight(a, b) {
      let pieces = document.querySelectorAll(".row>*");
      pieces.forEach(function (piece) {
         piece.removeAttribute('id');
         if (JSON.parse(piece.name)[0] === a && JSON.parse(piece.name)[1] === b) {
            piece.id = "highlight";
         }
      });
   }

   handleClick(a, b) {
      let player = this.Players[this.state.turn];
      //ensure we are working with a human
      if (player.constructor.name !== 'Human') {
         return;
      }
      let index = player.pieces.findIndex((element) => element[0] === a && element[1] == b);
      //check if a piece or if a space (returns false if index == -1)
      if (index + 1) { //piece
         //reset to old board using player.p_board (which was set at the beginning of the turn)
         this.state.spots = JSON.parse(JSON.stringify(player.p_board));
         player.update_pboard(JSON.parse(JSON.stringify(player.p_board)));
         //unhighlight all the pieces except selected piece, which must be highlighted
         if (index != player.move.piece) {
            //click on an unselected piece
            this.highlight(a, b);
         } else {
            //click on the selected piece
            let pieces = document.querySelectorAll("." + this.Players[this.state.turn].name);
            pieces.forEach(function (piece) {
               piece.removeAttribute('id');
            });
            index = -1; //"unselects" the clicked piece
         }
         player.move.state = moveStates.UNMOVED;
         player.move.piece = index;
      }
      else { //space
         if (player.move.piece === -1) {
            //you haven't selected a piece to move yet
            return;
         }
         //check if valid place to move on according to unupdated move state;
         for (let i = 0; i < 6; i++) {
            let p = player.pieces[player.move.piece]; //loc array
            //check valid slide
            if (a === p[0] + mc[i][0]
               && b === p[1] + mc[i][1]
               && this.state.spots[a][b] === "pos") {
               switch (player.move.state) {
                  case (moveStates.JUMPING): return;
                  case (moveStates.SLID): return;
                  case (moveStates.UNMOVED): {
                     player.move.state = moveStates.SLID;
                     //move the piece (update board)
                     this.state.spots[a][b] = player.name;
                     this.state.spots[p[0]][p[1]] = "pos";
                     player.pieces[player.move.piece] = [a, b]
                     this.highlight(a, b);
                  }
               }
            }
            //check valid jump
            if (a === p[0] + 2 * mc[i][0]
               && b === p[1] + 2 * mc[i][1]
               && this.state.spots[a][b] === "pos"
               && this.state.spots[p[0] + mc[i][0]][p[1] + mc[i][1]] !== "pos") {
               if (player.move.state === moveStates.SLID) {
                  //You cannot jump a piece after sliding it! Click a piece to reset your move
                  return;
               } else {
                  player.move.state = moveStates.JUMPING;
                  //move the piece (update board)
                  this.state.spots[a][b] = player.name;
                  this.state.spots[p[0]][p[1]] = "pos";
                  player.pieces[player.move.piece] = [a, b]
                  this.highlight(a, b);
               }
            }
         }
      }
      this.setState({
         spots: this.state.spots,
         turn: this.state.turn,
      });
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

   sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
   }

   async bot_move(index, move) {
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
      this.setState({
         spots: this.state.spots,
         turn: this.state.turn,
      });
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

   async run() {
      document.querySelector('.game-board').style.display = 'block';
      document.querySelector('.turnsign').style.display = 'block';
      document.querySelector('.execute').style.display = 'block';
      document.querySelector('.selection-menu').style.display = 'none';
      document.querySelector('.run').style.display = 'none';
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
      await this.complete_bots();
      this.Players[this.state.turn].turn(JSON.stringify(this.state.spots)); //updates next human's pieces
      this.setState({
         spots: this.state.spots,
         turn: this.state.turn,
      });
      let pieces = document.querySelectorAll("." + this.Players[this.state.turn].name);
      pieces = document.querySelectorAll(".row>*");
      pieces.forEach(function (piece) {
         piece.removeAttribute('id');
      });
   }

   async complete_bots() {
      document.querySelector('.execute').style.display = 'none';
      while (!(this.Players[this.state.turn].constructor.name === 'Human')) {
         let move = this.Players[this.state.turn].turn(JSON.stringify(this.state.spots));
         if (move) {
            //highlight initial spot of the piece about to move
            let p = this.Players[this.state.turn].pieces[move.piece];
            let t = TRANS[this.state.turn + 6];
            this.highlight(8 * t[0] + p[0] * t[1] + p[1] * t[2], 8 * t[3] + p[0] * t[4] + p[1] * t[5]);
            await this.sleep(SPEED);
            let pieces = document.querySelectorAll("." + this.Players[this.state.turn].name);
            pieces.forEach(function (piece) {
               piece.removeAttribute('id');
            });
            this.bot_move(this.state.turn, move);
            //highlight final place
            p = move.dest;
            this.highlight(8 * t[0] + p[0] * t[1] + p[1] * t[2], 8 * t[3] + p[0] * t[4] + p[1] * t[5]);
            await this.sleep(SPEED);
            pieces.forEach(function (piece) {
               piece.removeAttribute('id');
            });
         }
         if (this.winner(this.state.turn)) {
            this.setState({
               spots: this.state.spots,
               turn: this.state.turn,
            });
            document.querySelector('.winner').style.display = 'flex';
            document.querySelector('.winner>p').innerHTML = "Player" + (this.state.turn + 1) + " wins! ";
            return;
         }
         this.state.turn = (this.state.turn + 1) % 6;
         this.setState({
            spots: this.state.spots,
            turn: this.state.turn,
         });
      }
      document.querySelector('.execute').style.display = 'block';
   }

   async execute_turn() {
      //check to see if you've moved your pieces yet
      if (this.Players[this.state.turn].move.state === moveStates.UNMOVED) {
         //todo: change to a function call instead of an alert
         document.querySelector('#error').style.display = 'block';
         return;
      }
      document.querySelector('#error').style.display = 'none';
      //unhighlight the selected piece
      let pieces = document.querySelectorAll("." + this.Players[this.state.turn].name);
      pieces.forEach(function (piece) {
         piece.removeAttribute('id');
      });
      //execute bot turns until next human turn
      if (this.winner(this.state.turn)) {
         document.querySelector('.winner').style.display = 'flex';
         document.querySelector('.winner>p').innerHTML = "Player" + (this.state.turn + 1) + " wins! ";
         return;
      }
      this.state.turn = (this.state.turn + 1) % 6;
      await this.complete_bots();
      //need to await completion of this.complete_bots();
      this.Players[this.state.turn].turn(JSON.stringify(this.state.spots)); //updates next human's pieces
      this.setState({
         spots: this.state.spots,
         turn: this.state.turn,
      });
      pieces = document.querySelectorAll(".row>*");
      pieces.forEach(function (piece) {
         piece.removeAttribute('id');
      });
   }

   render() {
      return (
         <>
            <button class="run" onClick={() => this.run()}>Play!</button>
            <p class={"turnsign " + "p" + this.state.turn}>Player {this.state.turn + 1}'s turn</p>
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
            <p id="error">Please move a piece before submitting!</p>
            <button class={"execute " + "p" + this.state.turn} onClick={() => this.execute_turn()}>
               {"Complete Player " + (this.state.turn + 1) + "'s turn"}
            </button>
            <div class="winner">
               <p class="centered-element"></p>
               <br></br>
               <button class="centered-element" onClick={() => location.reload()}>OK</button>
            </div>
         </>
      );
   }
}
