"""Build four editable Blender roof kits and synchronous Three.js geometry.

Run with Blender --background --python tools/build_village_roofs.py.
The 8 x 8 m kits are decorative and do not alter game housing capacity.
"""
import bpy
import json
import math
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
MATERIALS = {}
PALETTE = {
    'concrete': ('#aaa89e', 0, .96),
    'patch': ('#747771', 0, .98),
    'tar': ('#53585a', 0, 1),
    'cream': ('#c8c2ad', 0, .92),
    'pink': ('#bd9589', 0, .94),
    'grey': ('#b5b9b7', 0, .95),
    'brick': ('#997668', 0, .98),
    'blue': ('#758e9d', .2, .74),
    'sheet': ('#a4a9a4', .35, .7),
    'rust': ('#776357', .3, .85),
    'steel': ('#b9c1c3', .65, .33),
    'dark': ('#3e494b', .1, .8),
    'glass': ('#50616a', .2, .36),
    'linen': ('#dfd6be', 0, 1),
    'cloth': ('#7c9299', 0, 1),
    'pot': ('#8f6b55', 0, 1),
    'leaf': ('#6e795d', 0, 1),
}


def linear(c):
    return c / 12.92 if c < .04045 else ((c + .055) / 1.055) ** 2.4


for key, (color, metal, rough) in PALETTE.items():
    material = bpy.data.materials.new(key)
    material.use_nodes = True
    rgb = tuple(linear(int(color[i:i+2], 16) / 255) for i in (1, 3, 5))
    bsdf = material.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*rgb, 1)
    bsdf.inputs['Metallic'].default_value = metal
    bsdf.inputs['Roughness'].default_value = rough
    material.diffuse_color = (*rgb, 1)
    MATERIALS[key] = material

objects = []


def finish(obj, name, material, bevel=0):
    obj.name = name
    obj.data.materials.append(MATERIALS[material])
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        modifier = obj.modifiers.new('Soft worn edges', 'BEVEL')
        modifier.width = bevel
        modifier.segments = 2
    objects.append(obj)
    return obj


def box(name, xyz, dimensions, material, bevel=.025):
    bpy.ops.mesh.primitive_cube_add(size=1, location=xyz)
    obj = bpy.context.object
    obj.dimensions = dimensions
    return finish(obj, name, material, bevel)


def cylinder(name, xyz, radius, height, material, vertices=16):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=height, location=xyz)
    return finish(bpy.context.object, name, material, .012)


def rod(name, a, b, radius=.018, material='rust'):
    center = (Vector(a) + Vector(b)) * .5
    delta = Vector(b) - Vector(a)
    obj = cylinder(name, center, radius, delta.length, material, 8)
    obj.rotation_mode = 'QUATERNION'
    obj.rotation_quaternion = delta.to_track_quat('Z', 'Y')
    return obj


def tank(x, y, radius=.55, height=1.2):
    for dx in [-.43, .43]:
        for dy in [-.43, .43]:
            box('Tank support', (x+dx, y+dy, .26), (.055, .055, .5), 'rust', .01)
    box('Tank base', (x, y, .52), (1.3, 1.3, .09), 'dark')
    cylinder('Stainless water tank', (x, y, .57+height/2), radius, height, 'steel', 24)
    for z in [.64, .86, 1.08, 1.3, 1.52]:
        cylinder('Rolled tank seam', (x, y, z), radius+.025, .035, 'steel', 24)
    cylinder('Tank lid', (x, y, .6+height), radius+.045, .08, 'steel', 24)
    rod('Water outlet', (x+radius, y, .7), (x+radius+.2, y, .7), .035, 'grey')
    rod('Water downpipe', (x+radius+.2, y, .7), (x+radius+.2, y, .05), .035, 'grey')


def room(x, y, width, depth, height, color):
    box('Rooftop stair enclosure', (x,y,height/2), (width,depth,height), color)
    box('Stair enclosure coping', (x,y,height+.08), (width+.18,depth+.2,.16), 'concrete')
    box('Dark stairwell door', (x-.25,y-depth/2-.02,.91), (.73,.04,1.8), 'dark', .01)
    box('Door lintel', (x-.25,y-depth/2-.06,1.85), (.9,.12,.12), 'grey')
    box('Side window shadow', (x+width/2+.016,y,1.3), (.035,.8,.65), 'dark', .005)
    box('Side window glass', (x+width/2+.04,y,1.3), (.035,.69,.55), 'glass', .005)
    for dy in [-.28, 0, .28]:
        box('Security bars', (x+width/2+.07,y+dy,1.3), (.025,.022,.59), 'steel', 0)
    for j in range(4):
        box('Repaired facade patch', (x-width*.42+j*.19,y-depth/2-.025,.2+j*.045), (.18,.025,.35), 'patch', 0)


def shed(x, y, width, depth, height, material):
    for dx in [-width*.45, width*.45]:
        for dy in [-depth*.42, depth*.42]:
            box('Shelter post', (x+dx,y+dy,height/2), (.055,.055,height), 'rust', .01)
    roof = box('Corrugated roof sheet', (x,y,height), (width,depth,.045), material, .012)
    roof.rotation_euler.x = -.055
    for j in range(int(width/.17)+1):
        rib = box('Corrugation', (x-width/2+j*.17,y,height+.04), (.035,depth,.04), material, .008)
        rib.rotation_euler.x = -.055
    for dx in [-width*.45, width*.45]:
        rod('Roof truss', (x+dx,y-depth*.42,height-.17), (x+dx,y+depth*.42,height-.17), .025)


def laundry(x,y,width):
    for dx in [-width/2,width/2]:
        rod('Drying pole',(x+dx,y,0),(x+dx,y,1.55),.025,'steel')
    rod('Clothesline',(x-width/2,y,1.5),(x,y,1.39),.009,'dark')
    rod('Clothesline',(x,y,1.39),(x+width/2,y,1.5),.009,'dark')
    for j in range(4):
        obj=box('Drying fabric',(x-width*.3+j*width*.2,y,1.05),(.35,.025,.7),['linen','cloth','pink','grey'][j],.01)
        obj.rotation_euler.z = .08*(j-1)


def export_parts(kit_objects):
    buckets = {}
    graph = bpy.context.evaluated_depsgraph_get()
    for obj in kit_objects:
        evaluated = obj.evaluated_get(graph)
        mesh = evaluated.to_mesh()
        mesh.calc_loop_triangles()
        key = obj.data.materials[0].name
        part = buckets.setdefault(key, {'color':PALETTE[key][0], 'metalness':PALETTE[key][1],
                                       'roughness':PALETTE[key][2], 'positions':[], 'normals':[]})
        for triangle in mesh.loop_triangles:
            for vertex_id in triangle.vertices:
                point = obj.matrix_world @ mesh.vertices[vertex_id].co
                normal = obj.matrix_world.to_3x3() @ triangle.normal
                # Blender Z-up to Three Y-up, preserving handedness.
                part['positions'].extend(round(v,5) for v in (point.x,point.z,-point.y))
                part['normals'].extend(round(v,5) for v in (normal.x,normal.z,-normal.y))
        evaluated.to_mesh_clear()
    return list(buckets.values())


kits=[]
for index, name in enumerate(['Laundry terrace','Blue sheet extension','Pink stair tower','Split roof workshop']):
    objects=[]
    box('Patched roof surface',(0,0,-.035),(7.65,7.65,.07),'patch',.015)
    for j in range(7):
        x=-3+(j%4)*1.6
        y=-2.9+(j//4)*5.2
        box('Roof waterproof repair',(x,y,.012),(.8+(j%3)*.3,.55+(j%2)*.4,.02),'tar',0)
    if index==0:
        room(-1.9,1.7,2.6,2.8,2.25,'cream')
        tank(2,2)
        laundry(-.3,-2.3,4.5)
        shed(2,-.8,2.7,2,1.8,'sheet')
    elif index==1:
        room(-2.1,1.8,2.3,2.4,1.95,'grey')
        shed(.7,-.7,5.5,4.3,1.8,'blue')
        tank(2.1,2.3,.48,1.05)
    elif index==2:
        room(1.6,1.7,3.2,3.3,2.65,'pink')
        tank(-2.2,2.2)
        laundry(-.3,-2.5,4.5)
        shed(-2.2,-.5,2.6,2.6,1.3,'sheet')
    else:
        room(-1.5,2,3.7,2.2,2.1,'brick')
        shed(.4,-1.6,5.8,2.7,1.6,'sheet')
        tank(2.5,2,.46,1.1)
        box('Rooftop utility cabinet',(2.2,.3,.5),(1.1,.6,1),'grey')
        for j in range(8):
            box('Cabinet ventilation',(2.2,-.015,.24+j*.075),(.85,.025,.025),'dark',0)
    for j in range(3):
        cylinder('Terrace planter',(-3.1+j*.65,-3.1,.18),.21,.34,'pot',12)
        cylinder('Low planter greenery',(-3.1+j*.65,-3.1,.4),.23,.2,'leaf',10)
    for j in range(3):
        box('Stacked repair brick',(2.8+(j%2)*.26,-3,.08+(j//2)*.1),(.24,.45,.1),'brick',.01)
    for x in [-3.7,3.7]:
        box('Terrace parapet',(x,0,.35),(.12,7.5,.7),'concrete')
    for y in [-3.7,3.7]:
        box('Terrace parapet',(0,y,.35),(7.5,.12,.7),'concrete')
    kits.append({'name':name,'parts':export_parts(objects)})
    collection=bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(collection)
    for obj in objects:
        for old_collection in list(obj.users_collection):
            old_collection.objects.unlink(obj)
        collection.objects.link(obj)
        obj.location.x += (index%2)*9.5-4.75
        obj.location.y += (index//2)*9.5-4.75

payload={'generator':'Blender '+bpy.app.version_string, 'unitFootprint':8, 'kits':kits}
(ROOT/'dist/village-roof-assets.js').write_text('/* Generated by tools/build_village_roofs.py in Blender. */\nwindow.XiangliRoofAssets='+json.dumps(payload,separators=(',',':'))+';\n',encoding='utf-8')

# Render the exact exported kits as an inspectable asset sheet.
box('Preview ground',(0,0,-.22),(23,23,.3),'cream')
scene=bpy.context.scene
scene.render.engine='CYCLES'
scene.cycles.samples=24
scene.cycles.use_denoising=True
scene.world.color=(.7,.7,.7)
bpy.ops.object.light_add(type='AREA', location=(-6,-8,18))
bpy.context.object.data.energy=2600
bpy.context.object.data.shape='DISK'
bpy.context.object.data.size=10
bpy.ops.object.camera_add(location=(19,-25,24))
camera=bpy.context.object
camera.rotation_euler=(Vector((0,0,.4))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO'
camera.data.ortho_scale=28
scene.camera=camera
scene.render.resolution_x=1200
scene.render.resolution_y=1000
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.filepath=str(ROOT/'models/guangzhou-roof-kits.png')
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'models/guangzhou-roof-kits.blend'))
bpy.ops.render.render(write_still=True)
print('Exported',len(kits),'Blender roof kits')
