const inquirer = require('inquirer');
const mysql = require('mysql');
const connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: '',
    database: "bamazon"
  });

connection.connect(function(err) {
    if (err) throw err;
    start();
  });


function start(){
inquirer.prompt(
    {
    name: 'actionList',
    type: 'rawlist',
    message: "What action?",
    choices: ["View Products", "View Inventory", "Add Inventory", "Add New Item"]
}).then(function(action){
    let managerAction = action.actionList.toLowerCase();
    switch(managerAction){
        case 'view products':
        inventory();
        break;
        case 'view inventory':
        lowInventory();
        break;
        case 'add inventory':
        addInventory();
        break;
        case 'add new item':
        addProduct();
        break;
        default: 
        console.log("Please select a current option.");
        break;
    }
});
};


function returntoMenu() {
    inquirer.prompt({
        name: 'return',
        type: 'rawlist',
        choices: ["Return to Main Menu", "Exit"],
        message: "Would you like to return to the Main Menu or Exit?"
    }).then(function(answer){
        if (answer.return === "Return to Main Menu") {
            start();
        }
        else {
            connection.end();
        }
    })
};


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


function lowInventory(){
    let query = "SELECT * FROM products WHERE stock_quantity <= 5";
    connection.query(query, function(err, res){
        res.forEach(function(item){
        console.log(`Item Name: ${item.product_name} Quantity: ${item.stock_quantity}`);
    })
    returntoMenu();
    });
};


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
        message: "What item would you like to increase the inventory of?"
    }, 
    {
        name: 'quantity', 
        type: 'input',
        message: 'How many would you like to add?',
        validate: (x) => {if(isNaN(x) === false && parseInt(x) > 0) {return true} else {console.log("You must enter a valid response.")}}
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


function addProduct(){
    connection.query("SELECT * FROM products GROUP BY department_name", function(err, res){
    inquirer.prompt([
        {
            type: 'input',
            name: "name",
            message: "What is the product name?"
        },
        {
            type: 'rawlist',
            name: 'department',
            message: 'Which department should it go in?',
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
            message: 'How much does it cost?',
            validate: function(value){
                if (isNaN(value) === false && parseFloat(value) > 0){
                    return true;
                }
                console.log("\n You must enter a valid response above 0.");
            }
        },
        {
            type: 'input',
            name: 'quantity',
            message: 'How many would you like to add?',
            validate: function(value){
                if (isNaN(value) === false && parseFloat(value) > 0){
                    return true;
                }
                console.log("You must enter a valid response above 0.");
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
            console.log(`${item.quantity} ${item.name} added to inventory!`);
            returntoMenu();
        })
    })
})
};
