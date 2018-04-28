const mysql = require("mysql");
const inquirer = require("inquirer");
let shoppingCart = 0;

const connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "root",
  database: "bamazon"
});

connection.connect(function(err) {
  if (err) throw err;
  console.log("Welcome to Ed's Music! Rock on!!");
  start();
});

function start() {
  inquirer
    .prompt({
      name: "rockOrExit",
      type: "rawlist",
      message: "Would you like to [ROCK] your way to the cash register or [EXIT] ?",
      choices: ["ROCK", "EXIT"]
    })
    .then(function(answer) {
      if (answer.buyOrExit.toUpperCase() === "ROCK") {
        buyRock();
      }
      else {
        connection.end();
      }
    });
}



function buyRock() {
  connection.query("SELECT * FROM products", function(err, results) {
    if (err) throw err;
    inquirer
      .prompt([
        {
          name: "choice",
          type: "rawlist",
          choices: function() {
            var choiceArray = [];
            for (var i = 0; i < results.length; i++) {
              choiceArray.push(results[i].product_name);
            }
            return choiceArray;
          },
          message: "What tunes are you into?"
        },
        {
          name: "quantity",
          type: "input",
          message: "How many?"
        }
      ])
      .then(function(answer) {
        
        let chosenItem;
        for (let i = 0; i < results.length; i++) {
          if (results[i].product_name === answer.choice) {
            chosenItem = results[i];
          }
        }
        let prodSale = answer.quantity * chosenItem.price;

        shoppingCart = parseFloat(shoppingCart + prodSale);
        connection.query(
            "UPDATE products SET ? WHERE ?", [
                {product_sales: prodSale},
                {
              item_id: chosenItem.item_id
                }
            ], 
            function(err){
                if (err) throw err;
            }
        ); 
        connection.query(
            "UPDATE products SET ? WHERE ?",
            [
              {
                stock_quantity: (chosenItem.stock_quantity - answer.quantity)
              }, 
                {
                item_id: chosenItem.item_id
                }
            ],
            function(error) {
              if (error) throw error;
              console.log(answer.quantity + " " + chosenItem.product_name + " purchased!");
              console.log("Your current total is: " + shoppingCart);
              start();
            }
          );
        
      });
  });
}