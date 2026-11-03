# 广州城中村屋顶资产

根据开发者提供的广州城中村照片提炼楼顶加建、错落的楼梯间、灰蓝铁皮棚、水箱和晾晒空间。模型为原创游戏资产，不对应照片中某一栋真实建筑，也不是康乐村测绘模型。

- `guangzhou-roof-kits.blend`：Blender 4.5 LTS 源文件，四套模型分别放在独立集合内，可直接编辑。
- `guangzhou-roof-kits.png`：在 Blender 中渲染的四套资产预览，不是游戏截图。
- `../tools/build_village_roofs.py`：生成与导出脚本。
- `../dist/village-roof-assets.js`：供网页加载的几何数据，按材质合并。游戏为不同建筑复用几何和材质，不需要在线下载模型。

在项目目录运行：

```sh
blender --background --python tools/build_village_roofs.py
node check-model.cjs
```

四套资产的基准范围为 8 × 8 米，导出时将 Blender 的 Z 轴高度转为 Three.js 的 Y 轴高度。游戏按楼栋占地比例缩放与旋转，保持装饰高度不变。它们用于 20 栋可操作楼和 42 栋外围装饰楼；楼栋原有楼层、容量、选中和改造规则保持不变。

修改 Blender 源文件后，若要保留手工编辑，请另存文件。重新运行生成脚本会覆盖该脚本生成的源文件和网页资产。
