const mysql = require('mysql');
const inquirer = require('inquirer');
const Table = require('cli-table');

const connection = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'root',
    database: 'bamazon'
});
let currentStats = new Table({
    head: ['department_id', 'department_name', 'over_head_costs', 'product_sales', 'total_profit'],
    colWidths: [25, 25, 25, 25, 25,]
});


function start(){
    inquirer.prompt(
        {
            type: 'rawlist',
            name: 'choice',
            message: "Hello, what activity today?",
            choices: ['View Product Sales for each Dept.', 'Create New Dept.', 'Exit']
        }
    ).then(function(answer){
        switch (answer.choice){
            case 'View Product Sales for each Dept.':
            salesStats();
            break;
            case 'Create New Dept.': 
            newDept();
            break;
            case 'Exit':
            connection.end()
            break;
        }
    })
}


function salesStats(){
    connection.query(`SELECT departments.department_id, SUM(product_sales), departments.department_name, over_head_costs, SUM(product_sales) - over_head_costs as total_profit
	FROM products
    INNER JOIN departments
    ON products.department_name = departments.department_name
    GROUP BY departments.department_name
    ORDER BY department_id`, function(err, res){
        function zerofy(arg){
            if(arg === null) {
                return 0;
            }
            else {
                return arg;
            }
        };
        res.forEach(function(department){
            let id = department.department_id;
            let prodSales = department['SUM(product_sales)'];
            let deptName = department.department_name;
            let overHead = department.over_head_costs;
            let profit = department.total_profit;
            currentStats.push([id, deptName, zerofy(overHead), zerofy(prodSales), zerofy(profit)]);
        });
        
        console.log(currentStats.toString());
        start();
    })
};

function newDept(){
    inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'What would you like to name your department?'
        },
        {
            type: 'input',
            name: 'overhead',
            message: "What were the over head costs for creating this department?",
            validate: (x) => {
                x.replace(/\,/g,'');
                if (isNaN(x) === false && parseFloat(x) > 0) { 
                return true; }  
            console.log("\n You must enter a valid number above 0.");
        }
        }
    ]).then(function(answers){
        deptName = answers.name.replace(/\s+/g, "_").toLowerCase();
        connection.query("INSERT INTO departments SET ?",
        {
            department_name : deptName,
            over_head_costs: answers.overhead
        },
         function(err, res){
             console.log(`${deptName} added to departments with an over head of ${answers.overhead}.`);
             start();
        })
    })
}

start();
