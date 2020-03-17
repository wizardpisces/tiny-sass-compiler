/**
 * test variable and nested
 */
module.exports = scss = `
$top : 20px;
$margin: 2px;
$right: $top;
.main2{
    margin: 1px;
    right: $right;
}
.main {
    top  : $top;   
    .child1{
        margin:$margin;
        .child2{
            background:green;
        }
    }
}`
