#version 300 es

precision mediump float;

in vec4 aPosition;
in vec3 aNormal; 

uniform mat4 mModelView;     
uniform mat4 mProjection;    
uniform mat4 mNormals;       

out vec4 vPosition;  
out vec3 vNormal;    

void main() {
    vPosition = aPosition;
    vNormal = (mNormals * vec4(aNormal, 0.0)).xyz;

    gl_Position = mProjection * mModelView * aPosition;
}
