from PIL import Image
from math import *

img = Image.open("images/DP.jpg")
w = img.width
h = img.height

def get_color_towards(c1: tuple, c2: tuple, percentage):
    return tuple(int(c1[i]+percentage*(c2[i]-c1[i])) for i in range(3))

def avg(c1, c2):
    return tuple([(c1[i]+c2[i])//2 for i in range(3)])

# CONSTANTS
white = (255, 255, 255)
black = (0, 0, 0)
red = (255, 0, 0)
green = (0, 255, 0)
blue = (0, 0, 255)
yellow = (255, 255, 0)
orange = (255, 150, 0)
purple = (152, 0, 255)

# USER
standards = 0
interpolation_limit = 1
div = 0

def f(r,g,b):
    a = (r+g+b)/3
    f = a/div
    return standards[ceil(f)-1]

def interpolate_standards():
    global div, standards
    for interpolation_counter in range(interpolation_limit):
        n = len(standards)
        for k in range(n-1):
            index = k*2+1
            standards.insert(index, avg(standards[k*2], standards[k*2+1]))
    div = 255/len(standards)


for i in range(w):
    # standards becomes a function of i
    standards = [get_color_towards(orange, blue, i/w), white]
    interpolate_standards()
    
    for j in range(h):
        [r, g, b] = img.getpixel((i, j))
        img.putpixel((i,j), f(r,g,b))

img.show()
# img.save("shaded2.png")