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
  console.log("Welcome to Selene's Books! We have all your magic needs. Blessed Be!");
  start();
});

function start() {
  inquirer
    .prompt({
      name: "buyOrExit",
      type: "rawlist",
      message: "Would you like to [BUY] some stuff or [EXIT] ?",
      choices: ["BUY", "EXIT"]
    })
    .then(function(answer) {
      if (answer.buyOrExit.toUpperCase() === "BUY") {
        buyStuff();
      }
      else {
        connection.end();
      }
    });
}



function buyStuff() {
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
          message: "What item would you like to buy?"
        },
        {
          name: "quantity",
          type: "input",
          message: "How many would you like to buy?"
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