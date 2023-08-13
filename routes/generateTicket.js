const numberOfRowsInTicket = 3;
const numberOfColumnsInTicket = 9;
const totalNumbersInRow = 5;
const numberOfMaxTickets = 10;

class Ticket {
  posArray = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
  ];
  ticketArray = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
  ];

  setTicketNumber = (num) => {
    this.ticketNumber = num;
  };

  getTicketNumber = () => {
    return this.ticketNumber;
  };

  setPositionArray = () => {
    for (let i = 0; i < numberOfRowsInTicket; i++) {
      let arr = findColumnElements(
        0,
        numberOfColumnsInTicket,
        totalNumbersInRow
      ); //Generate 5 numbers from 0 to 9(included)
      for (let j = 0; j < totalNumbersInRow; j++) {
        this.posArray[i][arr[j]] = 1;
      }
    }
  };

  getPositionArray = () => {
    return this.posArray;
  };

  setTicketArray = () => {
    for (let i = 0; i < numberOfColumnsInTicket; i++) {
      let count = 0;
      //---------Find number of elements in ith column---------//
      for (let j = 0; j < numberOfRowsInTicket; j++) {
        if (this.posArray[j][i] === 1) count++;
      }

      //---------Find ith column elements---------//
      let arr = [];
      if (i === 0) {
        arr = findColumnElements(1, 10, count);
      } else if (i === numberOfColumnsInTicket - 1) {
        arr = findColumnElements(80, 91, count);
      } else {
        arr = findColumnElements(i * 10, (i + 1) * 10, count);
      }

      //---------Updating ticketArray---------//
      let ind = 0;
      for (let j = 0; j < numberOfRowsInTicket; j++) {
        if (this.posArray[j][i] === 1) {
          this.ticketArray[j][i] = arr[ind++];
        }
      }
    }
  };

  getTicketArray = () => {
    return this.ticketArray;
  };
}

//-------Generate {count} number of column elements within range (utility function)---------//
const findColumnElements = (min, max, count) => {
  //   console.log("Finding col elements");
  let arr = [];
  while (arr.length < count) {
    let r = Math.floor(Math.random() * (max - min) + min);
    if (arr.indexOf(r) === -1) arr.push(r);
  }
  arr = arr.sort(function (a, b) {
    return a - b;
  });
  return arr;
};


const isValidTicket = (obj) => {
  for (let i = 0; i < numberOfColumnsInTicket; i++) {
    let count = 0;
    //---------Checking each column---------//
    for (let j = 0; j < numberOfRowsInTicket; j++) {
      if (obj.posArray[j][i] === 1) count++;
    }
    if (count === 0) return false;
  }
  return true;
};

const generateTicket = () => {
  let obj = new Ticket();

  //--------------Set Valid Position Array [posArray]--------------//
  obj.setPositionArray();

  // Check valid ticket or not
  while (isValidTicket(obj) === false) {
    //Reset Position Array
    for (let i = 0; i < numberOfRowsInTicket; i++) {
      for (let j = 0; j < numberOfColumnsInTicket; j++) {
        obj.posArray[i][j] = 0;
      }
    }
    obj.setPositionArray();
  }

  //--------------Set Ticket Array [ticketArray]--------------//  
  obj.setTicketArray();


  let obj1 = {}; 
  obj1.posArray = obj.posArray;
  obj1.ticketArray = obj.ticketArray;
  // console.log(obj1);
  // console.log(JSON.stringify(obj1));

  return obj1;
};

// generateTicket();

module.exports = { generateTicket };
