/* Contextual bilingual search terms. Learning links are not claims of implemented models. */
window.VillageKnowledge=(()=>{
const refs={flood:['广州市水务局：海绵城市建设—洪涝安全评估技术指引','https://swj.gz.gov.cn/gkmlpt/content/9/9983/post_9983905.html'],green:['广州市林业和园林局：广州市海绵城市绿地建设指引','https://lyylj.gz.gov.cn/gkmlpt/content/9/9564/post_9564254.html'],sun:['住房城乡建设部：城市居住区规划设计标准公告','https://www.mohurd.gov.cn/gongkai/zc/wjk/art/2018/art_17339_238590.html'],water:['USDA ARS：TR-55背景与技术资料','https://www.ars.usda.gov/research/software/download/?softwareid=8'],risk:['UNDRR：灾害风险术语','https://www.undrr.org/terminology/disaster-risk'],gis:['Esri：服务区与可达性','https://developers.arcgis.com/rest/services-reference/enterprise/service-area-sync/'],location:['Esri：区位—分配分析','https://doc.esri.com/en/arcgis-pro/latest/help/analysis/networks/location-allocation-tutorial.html'],climate:['Oke（1981）：城市峡谷与天空可视因子','https://doi.org/10.1002/joc.3370010304'],place:['Scannell与Gifford（2010）：地方依恋框架','https://doi.org/10.1016/j.jenvp.2009.09.006'],heritage:['UNESCO：保护非物质文化遗产公约','https://www.unesco.org/en/legal-affairs/convention-safeguarding-intangible-cultural-heritage'],industry:['康乐村制造业空间集聚研究（2012）','https://www.dlyj.ac.cn/CN/abstract/article/1000-0585/9999']};
const terms=[
['surface','下垫面','Underlying surface','water','地表覆盖、材质与土壤等共同构成大气下方的边界，影响水分与能量交换。','观察同一场降雨落在硬铺装、树池和雨水花园时，可能产生不同结果。','游戏仅用预设系数对比新增小地块，未实现完整水文过程。','water'],
['runoff','产流与下渗','Runoff generation and infiltration','water','降水进入地表后，一部分下渗、暂存或蒸发，其余可能形成地表径流。','铺装改变不能单独解释所有积水，还要看土壤、地势、管网与维护。','本游戏采用面积与假定系数的教学对照，不做汇流演算。','water'],
['cn','SCS-CN径流曲线数法','SCS/NRCS Curve Number method','water','根据降雨、土壤组、土地覆盖与前期条件等估计事件直接径流的一类经验方法。','想进一步研究“下垫面如何影响产流”，可以从曲线数CN和适用条件入手。','延伸学习：本游戏没有实现SCS-CN，显示的产流差值不是该方法的结果。','water'],
['ponding','积水与雨洪敏感性','Urban ponding and flood susceptibility','water','积水是雨水在地面暂时聚集的现象。雨洪敏感性描述某个位置在给定条件下容易积水的程度。','低洼路口、硬化广场和堵塞的雨水口，可以分别从地形、地面材质和排水设施三个角度检查。','雨洪图层是教学情境；颜色表示相对敏感程度，不能读成积水深度、发生概率或预警等级。','flood'],
['sun-hours','直射日照时长','Direct sunshine duration','light','在指定日期和位置，太阳直射未被阻挡的累计时间。它由太阳路径、朝向和遮挡共同决定。','改造时比较各层日照分钟数，才能看出同一栋楼的受益者分布。','游戏取冬至晴天、临街立面三点平均，只考虑民居体块；60分钟是教学比较阈值。','sun'],
['daylight','室内天然采光','Daylighting','light','室内利用来自太阳和天空的自然光获得照明。它影响室内白天是否够亮、亮得是否均匀，以及会不会眩光。','巷中房间即使没有直射，也可能靠散射天光变亮。窗前的遮挡和房间进深会影响光线能走多远。','游戏的逐层数据只比较临街外立面的直射时间，没有计算室内照度。','sun'],
['bioretention','雨水花园与生物滞留','Rain garden and bioretention','water','利用浅洼地、植物和土层临时接住雨水，再让水下渗、过滤或经排水层缓慢排出。','能接到来水、能安全溢流的种植洼地，才可能发挥滞蓄作用。','游戏按设施面积和教学系数估算产流差值，不计算土层饱和或溢流过程。','flood'],
['heat','遮阴、蒸散与热舒适','Shade, evapotranspiration and thermal comfort','green','遮阴减少人体和地面受到的太阳辐射；蒸散通过水分蒸发消耗热量。人体的热感还受风、湿度和活动影响。','在夏日候车点，能不能站在阴影下，可能比街区总绿量更直接影响等待体验。','游戏显示树冠投影和种植面积，未计算人体热舒适或降温幅度。','green'],
['relocation','居住容量与周转安置','Housing capacity and temporary relocation','planning','居住容量是按房间和入住假设估算可容纳的人数。周转安置关注施工期间原住户暂住何处，以及工程结束后谁能够回来。','退界重建可能保留部分容量，但施工期间原住户仍可能需要先搬出。','本游戏的房间数和入住人数为教学假设，不推断真实人口、租户资格或补偿金额。',null],
['planting','地面种植率','Ground planting fraction','green','本游戏用地面种植床和树池面积占固定统计区的比例，表示有多少地面真正用于种植。','腾地后如果仍铺硬地，种植率不一定改变。花槽和树池各按游戏中实际设置的种植面积计入。','采用固定教学边界，属于游戏定义。现实规划的绿地率应按当地规范核算。','green'],
['canopy','树冠覆盖率','Tree canopy cover','green','从正上方向地面看，树冠投影覆盖的面积占统计范围的比例。重叠部分只算一次。','成熟乔木的枝叶可以伸出树池，覆盖旁边的硬地或座椅。','游戏用简化树冠投影估算，冠幅随季节、生长或修剪的变化未模拟。','green'],
['svf','天空可视因子','Sky View Factor · SVF','light','描述观察点上方天空相对开敞程度的几何量，常用于城市辐射交换与微气候研究。','窄巷和较高的周边建筑会改变天空开敞，也可能影响辐射与遮阴。','相关理论：游戏逐层显示冬至立面的直射日照时间。天空可视因子是另一个量，用来描述半球天空的开敞程度。','climate'],
['canyon','城市峡谷高宽比','Urban canyon aspect ratio · H/W','light','用建筑高度与街道宽度之间的比例描述街道峡谷几何形态。','结合朝向、太阳位置和材料来理解阴影、通风与热环境；不能仅凭比值判断舒适。','相关理论：界面提供游戏楼高与近似对侧距离，不做完整微气候计算。','climate'],
['access','网络可达性','Network accessibility','gis','用路网中的距离、时间或其他出行成本，描述到达设施的难易程度。','直线距离近，不一定走得到或走得近；桥、出口与绕行都会影响可达性。','简化应用：游戏使用小路网最短距离与入口近似接入。','gis'],
['service','服务区分析','Service area analysis','gis','识别从设施出发，在给定出行距离或时间内沿路网可到达的范围。','同一座便民驿站放在不同地点，可能覆盖不同的住户。','简化应用：80 米阈值与按房间估算的人口均为游戏设定，不是法定标准。','gis'],
['allocation','区位—分配分析','Location-allocation analysis','gis','在候选设施位置与需求之间进行配置，以满足覆盖、成本或距离等目标。','进一步比较“有限预算应该建几个驿站、建在哪里”。','延伸学习：游戏允许手动选址并对比覆盖，没有自动求解最优区位。','location'],
['hazard','危险性','Hazard','hazard','关注可能造成损害的过程、事件或活动，以及其强度、概率和空间分布等特征。','积水敏感位置不等于完整灾害风险；还要了解谁处于其中、能否应对。','概念关联：本游戏没有估计真实事件概率与强度。','risk'],
['exposure','暴露度','Exposure','hazard','关注处于可能受影响地点的人口、资产和其他要素。','同样的积水情境，住宅入口、通行路线或公共设施所受影响可能不同。','延伸学习：本游戏使用示意住户权重，未建立真实暴露数据库。','risk'],
['vulnerability','脆弱性与应对能力','Vulnerability and capacity','hazard','脆弱性涉及使人或系统更容易受损的条件；能力涉及应对、恢复等资源和本领。','空间条件相似，居民需求、维护能力与可获得的帮助仍可能不同。','概念关联：没有量化居民脆弱性，也不根据人物身份给出风险结论。','risk'],
['attachment','地方依恋','Place attachment','human','人与地点之间形成的情感、认知和行为联系，可从人与群体、心理过程和场所等方面理解。','茶桌、早餐档与长期交往的前埕，可能承载超出物理外观的价值。','案例理解：通过虚构街坊故事讨论，不对真实居民进行量表测量。','place'],
['living','活态传承','Safeguarding living heritage','culture','让社区认可的实践、知识与技艺能够继续被使用、传授和再创造，并重视相关群体的参与。','广绣不只是摆件；手艺人、学习机会、劳动与日常使用同样重要。','案例理解：故事与体验亭为虚构示例，不等于已经完成真实传承工作。','heritage'],
['participation','社区参与','Community participation','culture','让创造、使用和传承文化的群体参与识别、讨论和保护，而不只接受外部安排。','改造前埕或小店时，应考虑常用这里的人如何理解和使用空间。','延伸学习：便签可记录不同使用者的需求，游戏中的人物和意见属于虚构情境。','heritage'],
['cluster','产业集聚与地理邻近','Industrial agglomeration and geographical proximity','economy','产业活动在空间上集中，与劳动力、供应联系、信息和关系网络等因素相互作用。','制衣、设计与物流相邻可能便于联系，但仅仅摆在一起不保证协作。','案例理解：本版没有计算实际产出或集聚效应。','industry'],
['coupling','空间耦合与产业联系','Spatial coupling and industrial linkages','economy','关注不同功能或系统在空间组织与互动中的关联，需要先明确研究对象、尺度和指标。','从工坊、共创亭、街巷与生活服务的连接来理解功能关系。','相关理论：本版未计算耦合协调度；不能把设施数量当成正式耦合指数。','industry'],
['opportunity','机会成本','Opportunity cost','planning','作出一个选择时，所放弃的最佳替代选择的价值。','同样的预算可用于补绿、服务、排水或文化空间；选择需要比较不同受益者与代价。','决策练习：游戏展示预算约束，但不计算真实社会机会成本。',null],
['tradeoff','多目标权衡','Multi-objective trade-offs','planning','在成本、环境、服务、公平与文化等目标之间比较方案，各目标不一定同时改善。','增加设施也可能占用通行空间；整修立面并不会自动解决采光。','决策练习：保留多项结果，不将所有目标合并为一个专业评估分。',null]
].map(([id,zh,en,topic,definition,connection,status,ref])=>({id,zh,en,topic,definition,connection,status,ref}));
// Each lesson stands on its own before offering an optional reading link.
const lessons={
 surface:[
 '一块地是否容易产流，先看表层和下层。水泥表层几乎不让水向下渗；种植土可以吸收一部分水，但土壤已经饱和时，下渗空间就少了。透水砖即使表层能进水，基层堵塞或排水不畅，效果也会打折。',
 '同样下 60 毫米雨，10 平方米硬地和同面积的种植地都接到约 0.6 立方米雨水。它们接到的水一样多，差别在于有多少会从表面流走。'],
 runoff:[
 '雨落下后，可能被叶片截留、积在地表、渗进土壤，或顺坡流走。产流说的是有多少水变成地表径流，汇流说的是这些水沿什么路线、在什么时间聚到一起。',
 '巷口两块硬地产生的径流相近，但一块向河边排，一块流向被堵住的雨水口，积水表现就可能不同。'],
 cn:[
 'CN 是结合土壤水文组、土地覆盖、管理状况和前期湿润程度选取的经验参数。一般而言，在同一场降雨和同类模型假设下，CN 越高，潜在蓄水越小，估算的直接径流越大。',
 '把同一片场地从绿地改为密实铺装，会改变地表和土壤条件。只改铺装却沿用原来的 CN，可能掩盖这种差异。不同城市、场次或土地类型也需要核对适用条件。'],
 ponding:[
 '当地表汇来的水超过下渗、暂存和排水能力，低处就可能积水。短时强降雨、硬化表面、堵塞入口、下游顶托等原因可以同时存在，处理之前要先定位瓶颈。',
 '如果积水集中在有落叶盖住的雨水口附近，可以先检查入口。清理后仍反复积水，就应核对坡向、雨水口标高和管网能力。'],
 'sun-hours':[
 '同一时刻，太阳射线能到达立面采样点，这段时间就计入直射。朝向不利或射线被对楼挡住时，该采样点不计入。室内仍可能借助天空散射光获得亮度。',
 '两栋朝向相同的楼，中层可能越过对楼屋顶晒到太阳，一楼却整段被挡。拆楼或退界后，改善也可能集中在原来被遮挡的几层。'],
 daylight:[
 '屋内的光来自直射阳光、天空散射光，以及地面和墙面的反射。窗户的位置、透光情况和室内进深会影响光的分布。同一间屋里，靠窗很亮也可能伴随深处偏暗。',
 '朝向开敞前埕的小铺即使一整天没有明显光斑，也可能比朝向近处深色墙面的房间亮。比较室内照度要用照度测量或采光模拟。'],
 bioretention:[
 '雨水需要先沿坡面或导流开口进入花园，随后在浅洼和介质中短时蓄存。土壤渗透不佳时可设置排水层；超过容量的水则要有安全溢流去处，避免倒灌邻近住宅。',
 '在硬化广场旁放一块高起的花槽，可能根本接不到广场的径流。若沿坡设置下凹种植带并留出导水口，它才可能接住部分汇来的水。'],
 heat:[
 '人在阳光下会受到额外辐射，树荫可以减少这部分热负担。植物蒸散也可能降低局部热量，但水分供应、湿度与空气流动会影响效果。',
 '两段路的树冠面积相同，树集中在无人停留的角落，和树荫落在早餐排队区，对街坊的实际帮助可能很不一样。'],
 relocation:[
 '即使建成后的房间数能恢复到原有水平，也需要考虑施工期临时住处、返回条件、可负担租金以及日常路线。建筑容量只描述空间供给，原住户是否能留在社区取决于更多条件。',
 '原地有 12 间房，按两人一间估算约 24 人。若重建成 9 间，原址容量约 18 人。施工期可能涉及全部 24 人的周转，建成后的原址容量缺口是 6 人，这两个数字回答的是不同问题。'],
 planting:[
 '种植率关心地面到底留了多少空间给植物。同一统计边界下，扩大树池或把硬地改成种植床可以增加比例。硬地上方即便有树荫，硬地本身仍不算种植面积。',
 '广场边的一排小花槽和巷口的一棵乔木，可能占用相似的地面面积，却提供不同程度的遮阴。街巷太窄时，还要把通行宽度留出来。'],
 canopy:[
 '树冠盖过硬地也能产生树荫。树冠覆盖率看的只是平面投影，实际阴影还会随太阳高度和朝向移动，凉不凉也与风、铺装和空气湿度有关。',
 '两棵树相邻时，投影重叠的部分只记一次。把其中一棵移到另一处缺荫的巷口，覆盖率或许提高，但原来座椅的位置可能失去遮阴。'],
 svf:[
 '站在一个点向上看，建筑会遮住部分半球天空。天空可视因子关注天空对该点的开敞程度。直射日照还需要太阳正好走过可见方向，因此开敞程度相近的两处也可能晒到不同时间。',
 '十字巷口往上通常比夹在两栋高楼之间看得开，但早晨太阳的方向可能仍然被某一侧楼遮住。'],
 canyon:[
 '假设两侧楼高相近，用楼高 H 除以两侧立面之间的街宽 W，可以直观比较街巷的深窄程度。比例越大，天空往往越受围合，太阳是否照进来还要结合街道朝向。',
 '两侧约 12 米高、间距 4 米的窄巷，H/W 约为 3。同样高的楼若退界后间距 6 米，比例约为 2，太阳射线越过对楼的条件随之改变。'],
 access:[
 '把道路抽象成节点和路段，再把长度或步行时间作为路段代价。最短路径比较能实际通行的路线。实际可达性还会受过街、台阶、拥挤和无障碍条件影响。',
 '一处驿站看起来离河对面住宅只有几十米，但居民可能需要先走到桥口再绕回来，沿路距离远大于地图直线距离。'],
 service:[
 '从设施出发沿路网扩展，累计距离达到阈值便停止。落在范围内的入口可计入覆盖。如果多个驿站都能服务同一入口，计算总体覆盖时该住户只计一次。',
 '两个驿站挨得很近时，服务区可能大量重叠。把其中一个移向另一侧支巷，设施数量没变，但可能照顾到原来超出步行阈值的人。'],
 allocation:[
 '区位决定设施建在哪里，分配决定居民由哪处设施服务。常见目标有最大化阈值内覆盖人数、最小化总步行距离，也可以关注最远住户，选择不同目标可能得到不同位置。',
 '两处候选点中，一个靠人口密集楼群，另一个能照顾长期服务不足的支巷。追求覆盖人数最多和优先照顾最不方便的人，可能得出不同选择。'],
 hazard:[
 '危险性回答“可能发生什么，以及在何处、多强、多久一次”。降雨后易积水的位置可以成为初查线索；要判断危险性，还需要事件强度和频率等信息。',
 '同一巷口小雨时只有浅水，强降雨时可能出现更大的积水范围。图上的敏感颜色可以提示先查哪里，居民和资产是否受影响还要另看。'],
 exposure:[
 '暴露度问的是谁和什么位于可能受影响的范围内，以及他们在何时出现在那里。地点、时段和人口活动都很重要。',
 '同样一处低洼地，靠近空地时直接影响可能较少，若覆盖唯一住宅出口或早高峰摊档，受影响的通行和经营就不同。'],
 vulnerability:[
 '面对相同强度的事件，空间设施和人群的受影响程度可能不同。门槛高程、是否有备用出口、预警能否及时收到，都会影响损失与恢复。应对能力也包括邻里互助、管理和维护资源。',
 '两栋楼都靠积水点，一栋有第二个出口，另一栋只有低处入口。积水条件相似，居民能否安全绕行却不同。'],
 attachment:[
 '地方依恋来自持续的使用、回忆和社会关系。一个场所可能因为熟悉的路线、邻居、活动或归属感变得难以替代。不同使用者的理由也可能不同。',
 '把早餐档搬到更宽的路面，设施还在，老顾客上班路上的相遇却可能消失。新的位置也可能方便另一批居民。'],
 living:[
 '活态传承依赖实践者、传授机会和继续使用的环境。保留实物可以支持记忆，让技艺持续被教、被做和被使用，需要社区参与和可持续的安排。',
 '广绣展示牌能介绍名称与历史；若体验亭能让手艺人示范、居民学习并参与解释，才提供了具体的传授机会。'],
 participation:[
 '参与的价值在于让使用者影响方案。可以先收集使用经验，再让不同群体比较选项，公开解释取舍，并在实施后继续听反馈。',
 '改造前埕时，老人可能希望有遮荫座位，节庆组织者需要留出整块空地，附近店主还在意送货路径。只调查一种人容易遗漏这些差异。'],
 cluster:[
 '同类或上下游企业集中，可共享劳动力、供应商与物流，并通过频繁接触获得信息。地理邻近只是条件，信任、订单关系和租金也会影响协作。',
 '制衣工坊靠近布料供应和送货点，小批订单可以更快往返。如果把工坊搬远，即便新位置更宽敞，也可能增加运输与协调成本。'],
 coupling:[
 '空间耦合关注两个系统怎样借助位置和连接相互作用。要先说清楚系统是什么，再选择能观察互动的量，例如运送时间、客户共享或服务可达性。',
 '设计亭与制衣工坊隔一条巷很近，但如果物流车无法停靠、没有合作人员，空间邻近未必转成生产联系。'],
 opportunity:[
 '预算、地面和施工时间有限，选定一个方案就占用资源。机会成本是因此放弃的最佳替代方案原本能带来的收益，收益可以是服务、遮阴或更少的周转。',
 '把同一处空地给驿站，最有价值的替代方案也许是雨水花园。比较时要说清楚，选择驿站换来更多步行服务，放弃了哪些雨洪收益。'],
 tradeoff:[
 '当方案同时影响多个目标，提升一项可能降低另一项。先筛掉成本更高、表现却全面更差的方案，再比较有真实取舍的选项，并说明谁受益、谁承担代价。',
 '拆除腾地可能增加邻楼日照，也会降低原址容量；退界重建可能保留一部分容量，但日照增益更小。周转与租户需求会改变选择。']
};
const topics={water:['ponding','surface','runoff','bioretention','cn'],green:['planting','canopy','heat','bioretention'],light:['sun-hours','daylight','canyon','svf'],gis:['access','service','allocation'],risk:['hazard','exposure','vulnerability'],hazard:['hazard','exposure','vulnerability'],human:['attachment','participation','cluster'],culture:['attachment','living','participation'],economy:['cluster','coupling','living'],planning:['relocation','opportunity','tradeoff','allocation'],life:['attachment','living','opportunity']};
const $=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let active=null,query='';
function inline(id,topic){const target=$(id);if(!target)return;target.innerHTML='<small>继续探索 · 专业关键词</small><div class="term-chips">'+(topics[topic]||topics.life).map(key=>{const t=terms.find(t=>t.id===key);return '<button data-term="'+key+'">'+t.zh+' <span>'+t.en+'</span></button>';}).join('')+'</div>';}
function render(){const filtered=terms.filter(t=>!query||(t.zh+' '+t.en+' '+t.definition+' '+(lessons[t.id]||[]).join(' ')).toLowerCase().includes(query.toLowerCase()));$('theory-list').innerHTML=filtered.map(t=>'<button data-term="'+t.id+'" class="'+(t.id===active?'active':'')+'"><b>'+t.zh+'</b><small>'+t.en+'</small></button>').join('');if(!active){$('theory-content').innerHTML='<h3>从一个问题，找到一条学习路径。</h3><p>选一个词条，就可以阅读含义、形成机制和街区例子。想进一步学习时，可以展开最后的检索词与资料。</p>';return;}const t=terms.find(t=>t.id===active),r=t.ref?refs[t.ref]:null,[mechanism,example]=lessons[t.id];const related=(topics[t.topic]||[]).filter(key=>key!==t.id).slice(0,3).map(key=>'<button class="pill" data-term="'+key+'">'+terms.find(item=>item.id===key).zh+'</button>').join(' ');$('theory-content').innerHTML='<div class="eyebrow">LEARN BEYOND THE SCENE</div><h2>'+t.zh+'</h2><p class="term-english">'+t.en+'</p><h4>这个概念指什么？</h4><p>'+t.definition+'</p><h4>为什么会这样？</h4><p>'+mechanism+'</p><h4>用街区里的例子理解</h4><p>'+example+'</p><div class="term-scope">'+t.status+'</div>'+(related?'<h4>相关词条</h4><div class="term-related">'+related+'</div>':'')+'<details class="term-deeper"><summary>想深入再读 · 检索词与资料</summary><div id="theory-query" class="search-phrase">'+esc(t.zh+' '+t.en)+'</div><button id="copy-theory" class="secondary">复制中英文检索词</button>'+(r?'<p class="term-reading"><a href="'+r[1]+'" target="_blank" rel="noopener">'+r[0]+' ↗</a></p>':'<p class="term-reading">可使用上面的中英文检索词，查找城市规划、经济地理或公共决策教材中的相应章节。</p>')+'</details>';$('copy-theory').onclick=async()=>{try{await navigator.clipboard.writeText(t.zh+' '+t.en);$('copy-theory').textContent='已复制';}catch(_){$('copy-theory').textContent='可选中上方检索词复制';}};}
function open(id=null){active=id;query='';$('theory-search').value='';render();if(!$('theory-dialog').open)$('theory-dialog').showModal();}
function init(){for(const id of ['theory-context','node-theory','item-theory','theory-list','theory-content'])$(id).onclick=e=>{const b=e.target.closest('[data-term]');if(b){active=b.dataset.term;render();$('theory-content').scrollTop=0;if(!$('theory-dialog').open)$('theory-dialog').showModal();}};$('open-theory').onclick=()=>open();$('close-theory').onclick=()=>$('theory-dialog').close();$('theory-search').oninput=e=>{query=e.target.value.trim();render();};}
return {terms,topics,lessons,refs,inline,open,init};
})();
