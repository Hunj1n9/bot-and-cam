varying vec2 vUv;
attribute vec3 aInitialPosition;
attribute float aMeshSpeed;
uniform float uTime;
uniform float uMaxXdisplacement;


void main()
{     
    
    vec3 newPosition=position + aInitialPosition;

    float initialX = newPosition.x;
    

    newPosition.x = mod(initialX + uTime * aMeshSpeed, uMaxXdisplacement*4.) - uMaxXdisplacement*2.;


    vec4 modelPosition = modelMatrix * instanceMatrix * vec4(newPosition, 1.0);        


    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;    

    vUv = uv;
}