#version 300 es

in vec4 aPosition; 
in vec3 aNormal;  

struct LightInfo {
    vec4 position;  
    vec3 Ia;        
    vec3 Id;        
    vec3 Is;        
};

struct MaterialInfo { 
    vec3 Ka;        
    vec3 Kd;        
    vec3 Ks;       
    float shininess;
};

const int MAX_LIGHTS = 8;
uniform LightInfo u_light[MAX_LIGHTS];
uniform MaterialInfo u_material;

uniform mat4 mModelView;     
uniform mat4 mNormals;       
uniform mat4 mProjection;    
uniform int u_num_lights;
uniform int u_lightType[MAX_LIGHTS];

out vec4 vColor;  

void main() {
    vec3 posC = (mModelView * aPosition).xyz;  
    vec3 N = normalize((mNormals * vec4(aNormal, 0.0)).xyz); 
    vec3 V = normalize(-posC);  

    vec3 ambientSum = vec3(0.0);
    vec3 diffuseSum = vec3(0.0);
    vec3 specularSum = vec3(0.0);

    for (int i = 0; i < u_num_lights; i++) {
        vec3 L;  
        vec3 lightPos = (u_lightType[i] == 0) ? (mModelView * u_light[i].position).xyz : u_light[i].position.xyz;
        float distance = length(lightPos - posC);

        if (distance < 0.001) { 
            continue; 
        }

        if (u_lightType[i] == 0) { 
            L = u_light[i].position.w == 0.0
                ? normalize((mNormals * u_light[i].position).xyz)
                : normalize(lightPos - posC);
        } else if (u_lightType[i] == 1) { 
            L = u_light[i].position.w == 0.0
                ? normalize((u_light[i].position).xyz)
                : normalize(lightPos - posC);
        } else { 
            L = normalize(lightPos - posC);
        }

        vec3 H = normalize(L + V); 

        // Ambient
        ambientSum += u_light[i].Ia * u_material.Ka;

        // Diffuse
        float diffuseFactor = max(dot(N, L), 0.0);
        diffuseSum += diffuseFactor * u_light[i].Id * u_material.Kd;

        // Specular
        if (diffuseFactor > 0.0) {
            float specularFactor = pow(max(dot(N, H), 0.0), u_material.shininess);
            specularSum += specularFactor * u_light[i].Is * u_material.Ks;
        }
    }

    vec3 finalColor = ambientSum + diffuseSum + specularSum;
    vColor = vec4(finalColor, 1.0);  

    gl_Position = mProjection * mModelView * aPosition;
}
