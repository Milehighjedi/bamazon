const inquirer = require('inquirer');
const mysql = require('mysql');
const connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "root",
    database: "bamazon"
  });

connection.connect(function(err) {
    if (err) throw err;
    start();
  });


// Main menu, allows user to select different actions
function start(){
inquirer.prompt(
    {
    name: 'actionList',
    type: 'rawlist',
    message: "What would you like to do?",
    choices: ["View Products for Sale", "View Low Inventory", "Add to Inventory", "Add New Product"]
}).then(function(action){
    let managerAction = action.actionList.toLowerCase();
    switch(managerAction){
        case 'view products for sale':
        inventory();
        break;
        case 'view low inventory':
        lowInventory();
        break;
        case 'add to inventory':
        addInventory();
        break;
        case 'add new product':
        addProduct();
        break;
        default: 
        console.log("Please select a valid action.");
        break;
    }
});
};

//Allows user to either exit program or return to main menu options
function returntoMenu() {
    inquirer.prompt({
        name: 'return',
        type: 'rawlist',
        choices: ["Return to Main Menu", "Exit"],
        message: "Would you like to return to main menu or exit?"
    }).then(function(answer){
        if (answer.return === "Return to Main Menu") {
            start();
        }
        else {
            connection.end();
        }
    })
};

// Displays all current inventory

function inventory(){
    connection.query("SELECT * FROM products", function(err, res){
        if (err) throw err;
        res.forEach(function(item){
            console.log(`Item Name: ${item.product_name} \n Department: ${item.department_name} \n Price: ${item.price} \n Quantity: ${item.stock_quantity}`);
            console.log("----------------------------------------------------")
        })
        returntoMenu();
    });
};

// Displays all inventory with a quantity < 5
function lowInventory(){
    let query = "SELECT * FROM products WHERE stock_quantity <= 5";
    connection.query(query, function(err, res){
        res.forEach(function(item){
        console.log(`Item Name: ${item.product_name} Quantity: ${item.stock_quantity}`);
    })
    returntoMenu();
    });
};

// Allows user to add to the quantity of a product
function addInventory(){
    connection.query("SELECT * FROM products", function(err, res){
    inquirer.prompt([
        {
        name: 'choice',
        type: 'rawlist',
        choices: function(){
            let choiceArray = [];
            for (var i = 0; i < res.length; i++) {
                choiceArray.push(res[i].product_name);
              }
              return choiceArray;
        },
        message: "What item would you like to add inventory to?"
    }, 
    {
        name: 'quantity', 
        type: 'input',
        message: 'How many units would you like to add?',
        validate: (x) => {if(isNaN(x) === false && parseInt(x) > 0) {return true} else {console.log("You must enter a valid number.")}}
    },
    ]).then(function(item){

        let chosenItem;
        for (let i = 0; i < res.length; i++) {
          if (res[i].product_name === item.choice) {
            chosenItem = res[i];
          }
        }
        let query = "UPDATE products SET ? WHERE ?";
    connection.query(query, [{stock_quantity: (parseInt(chosenItem.stock_quantity) + parseInt(item.quantity))},{product_name : chosenItem.product_name}], function(error){
        if (error) throw error;
        console.log(`Added ${item.quantity} to ${chosenItem.product_name}.`);
        returntoMenu();
    })
    })
})
};

// Allows user to add a new product to the products table in the sql database
function addProduct(){
    connection.query("SELECT * FROM products GROUP BY department_name", function(err, res){
    inquirer.prompt([
        {
            type: 'input',
            name: "name",
            message: "What is the name of the product?"
        },
        {
            type: 'rawlist',
            name: 'department',
            message: 'Which department would you like to add it to?',
            choices: () => {
                let deptArray = [];
                res.forEach(function(item){
                    deptArray.push(item.department_name);
                })
                return deptArray;
            }
        },
        {
            type: 'input',
            name: 'price',
            message: 'How much does each unit cost?',
            validate: function(value){
                if (isNaN(value) === false && parseFloat(value) > 0){
                    return true;
                }
                console.log("\n You must enter a valid number above 0.");
            }
        },
        {
            type: 'input',
            name: 'quantity',
            message: 'How many units would you like to add?',
            validate: function(value){
                if (isNaN(value) === false && parseFloat(value) > 0){
                    return true;
                }
                console.log("You must enter a valid number above 0.");
            }
        }
    ]).then(function(item){
        connection.query("INSERT INTO products SET ?",
        {
            product_name: item.name,
            department_name: item.department,
            price: item.price,
            stock_quantity: item.quantity

        }, function(err, res){
            console.log(`${item.quantity} ${item.name} added to the inventory!`);
            returntoMenu();
        })
    })
})
};
