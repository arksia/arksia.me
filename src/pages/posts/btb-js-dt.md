---
title: <回归基本功 class="js">数据类型
date: 08/16/25
duration: 8 min
catalog: btb
desc: </ 基础不牢，地动山摇>
---

# 回归基本功 JavaScript 数据类型

今天是从学校搬离的整一个月，在憧憬了很久的独居小屋里写下这篇我真正意义上的第一博客。一年前的这时候我刚刚写完论文，但我知道 ... 概率不大，其实渐渐的也不难发现写文章对于我来说是一件很困扰的事。老实说，表达这一块我是有很大问题的，创新不难但要把故事讲好就不容易了，这也导致我对于读博的想法愈发消极。当时身边的同学工作或升学都在如火如荼的进行，而我就像凝滞了一样，今天想读博就搞搞研究，明天想工作就背背八股，一月一月的过去一事无成，真是至暗时刻。好在现在还是有出路了。

其实我也不知道这是在说些什么，就是想有个仪式在首篇文字的开头留下些刚毕业的感慨。保持学习的习惯吧，写写博客记录一下，希望能够提升我的表达能力。

书归正传，这个系列是我读 **JavaScript 高级程序设计** 的笔记。基础不牢，地动山摇，也希望这个博客可以督促我坚持看完这本书吧。

## 数据类型

ECMAScript 基准下有 7 种简单数据类型 (Undefined, Null, String, Number, BigInt, Boolean, Symbol) 和 1 种复杂数据类型 Object。该基准不允许自定义类型，但换而言之所有的数据都可以用这 8 种类型表示。

由于 ECMAScript 的类型系统是松散的，所以在确定数据类型时可使用 <code>typeof</code> **操作符** 返回类型对应的字符串。其中有两个特例，<code>function</code> 属于复杂数据类型，但有自己的特殊属性，所以可以通过 <code>typeof</code> 与其他对象做区分。<code>null</code> 是一个空对象的引用，不能通过 <code>typeof</code> 做判别。

```ts
function fun() {
  console.log('this is function object')
}
console.log(typeof fun) // function
console.log(typeof null) // object
```

### Undefined
<code>undefined</code> 用于表示已声明而未初始化的变量，一般来说不需要显式的设置这个值。<code>undefined</code> 不是 JS 的关键字，所以可以作为变量名。

```ts
const undefined = 'bad'
const foo
console.log(foo === undefined) // false
console.log(foo === void 0) // true
console.log(typeof foo === 'undefined') // true
```

规范不建议使用 <code>undefined</code> 作为变量名，但是为了保险起见，推荐用后两种方式作为 <code>undefined</code> 判别手段。

### Boolean
<code>boolean</code> 是最常使用的类型，该类型只有两个字面量 <code>true</code> 和 <code>false</code>。一般来说，需要注意的点在于条件判断语句对于 <code>boolean</code> 的自动转换，规则如下：
```ts
// !! converts other types to boolean

// Non-empty string
console.log(!!'Ark') // true
console.log(!!'') // false
// Non-zero number
console.log(!!1) // true
console.log(!!0) // false
// Non-null object
console.log(!!{}) // true
console.log(!!null) // false
// Really undefined
console.log(!!undefined) // false
```

