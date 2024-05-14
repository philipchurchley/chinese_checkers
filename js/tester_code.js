spots.forEach(function (spot) {
   let location = spot.classList;
   spot.addEventListener("click", function () {
      console.log("toggle selection 1");
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
      console.log(location);
      console.log(board);
   });
   spot.addEventListener("contextmenu", function (event) {
      event.preventDefault(); // Prevent the default context menu
      console.log("Right click on my-element at", event.clientX, event.clientY);
      // Additional custom logic here
      console.log("toggle selection 2");
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
      console.log(location);
   });
});
