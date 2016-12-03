// test dss
@color = blue;
@width = 100%;
@height = 20px;

#test {
    color: @color;
}

.test-stuff {
    color: #test.color; // this will bind the color of this element to the #test element's color
}

.another-class {
    height: 36px;
    width: @width;
}

.checkbox {
    text-decoration: underline;
}

.input {
    width: @width;
}

.divs {
    height: @height;
}