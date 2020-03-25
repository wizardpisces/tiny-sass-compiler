/**
 * test variable and nested
 */
module.exports = scss = `
$top : 20px;
$margin: 2px;
$right: $top;
.main2{
    $margin: 3px;
    margin: $margin;
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
