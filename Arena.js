//////////////////////////  Arena class /////////////////////////////////

function Arena () {

    this.vertices = [
        0.0,0.0,0.0,
        0.0,0.0,-ARENASIZE,
        0.0,WALLHEIGHT,-ARENASIZE,
        0.0,WALLHEIGHT,0.0,
        ARENASIZE,0.0,0.0,
        ARENASIZE,WALLHEIGHT,0.0,
        ARENASIZE,WALLHEIGHT,-ARENASIZE,
        ARENASIZE,0.0,-ARENASIZE,
        0.0,0.0,-ARENASIZE,
        ARENASIZE,0.0,-ARENASIZE,
        ARENASIZE,WALLHEIGHT,-ARENASIZE,
        0.0,WALLHEIGHT,-ARENASIZE,
        0.0,0.0,0.0,
        0.0,WALLHEIGHT,0.0,
        ARENASIZE,WALLHEIGHT,0.0,
        ARENASIZE,0.0,0.0,
        0.0,0.0,0.0,
        ARENASIZE,0.0,0.0,
        ARENASIZE,0.0,-ARENASIZE,
        0.0,0.0,-ARENASIZE
    ];

    this.normals = [
	1.0,0.0,0.0,
        1.0,0.0,0.0,
        1.0,0.0,0.0,
        1.0,0.0,0.0,
        -1.0,0.0,0.0,
        -1.0,0.0,0.0,
        -1.0,0.0,0.0,
        -1.0,0.0,0.0,
        0.0,0.0,1.0,
        0.0,0.0,1.0,
        0.0,0.0,1.0,
        0.0,0.0,1.0,
        0.0,0.0,-1.0,
        0.0,0.0,-1.0,
        0.0,0.0,-1.0,
        0.0,0.0,-1.0,
        0.0,1.0,0.0,
        0.0,1.0,0.0,
        0.0,1.0,0.0,
        0.0,1.0,0.0
    ];

    this.vBuffer = null;
    this.nBuffer = null;
    this.vPosition = null;
    this.vNormal = null;
    
    this.init = function () {

	    this.vBuffer = gl.createBuffer();
	    gl.bindBuffer( gl.ARRAY_BUFFER, this.vBuffer );
	    gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW );

	    this.nBuffer = gl.createBuffer();
	    gl.bindBuffer( gl.ARRAY_BUFFER, this.nBuffer );
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals), gl.STATIC_DRAW);

        /*
        this.iBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);

        this.tBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, this.tBuffer);
        gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(this.texCoord), gl.STATIC_DRAW );
        */

        // Texture 2
        var image2 = new Image();
        image2.crossOrigin = "anonymous";
        image2.src = "mountains.png";
        image2.onload = function () {
        var texture2 = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture2);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
            gl.UNSIGNED_BYTE, image2);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
            gl.NEAREST_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        };
    };

    this.show = function () {

	    gl.bindBuffer( gl.ARRAY_BUFFER, this.vBuffer );
	    this.vPosition = gl.getAttribLocation( program, "vPosition" );
	    if (this.vPosition < 0) {
	        console.log('Failed to get the storage location of vPosition');
	    }
	    gl.vertexAttribPointer(this.vPosition, 3, gl.FLOAT, false, 0, 0);
	    gl.enableVertexAttribArray( this.vPosition );    

	    gl.bindBuffer( gl.ARRAY_BUFFER, this.nBuffer );
	    this.vNormal = gl.getAttribLocation( program, "vNormal" );
	    if (this.vPosition < 0) {
	        console.log('Failed to get the storage location of vPosition');
	    }
	    gl.vertexAttribPointer( this.vNormal, 3, gl.FLOAT, false, 0, 0 );
	    gl.enableVertexAttribArray( this.vNormal );

        gl.bindBuffer(gl.ARRAY_BUFFER, this.tBuffer);
        this.vTexCoord = gl.getAttribLocation(program, "vTexCoord");
        if (this.vTexCoord < 0) {
            console.log('Failed to get the storage location of vTexCoord');
        }
        gl.vertexAttribPointer(this.vTexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.vTexCoord);

	    var ambientProduct = mult(la0, ma);
	    var diffuseProduct = mult(ld0, md);
	    var specularProduct = mult(ls0, ms);
	
	    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),
		          flatten(ambientProduct));
	    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),
		          flatten(diffuseProduct) );
	    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), 
		          flatten(specularProduct) );
	    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), 
		          flatten(lp0) );
	    gl.uniform1f(gl.getUniformLocation(program, "shininess"),
		         me);
	
	    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
	    gl.drawArrays(gl.TRIANGLE_FAN, 4, 4);
	    gl.drawArrays(gl.TRIANGLE_FAN, 8, 4);
	    gl.drawArrays(gl.TRIANGLE_FAN, 12, 4);

	    ambientProduct = mult(la0, black); // floor color
	    diffuseProduct = mult(ld0, red);
	    specularProduct = mult(ls0, red);
	
	    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),
		          flatten(ambientProduct) );
	    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),
		          flatten(diffuseProduct) );
	    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), 
		          flatten(specularProduct) );	
	
	    gl.drawArrays(gl.TRIANGLE_FAN, 16, 4);
	    // IMPORTANT: Disable current vertex attribute arrays so those in
	    // a different object can be activated.  
	    gl.disableVertexAttribArray(this.vPosition);
        gl.disableVertexAttribArray(this.vNormal);
        gl.disableVertexAttribArray(this.vTexCoord);
    };

};

//////////////////////////  End Arena object /////////////////////////////////