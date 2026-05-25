import { useState, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'

export default function InterviewPractice() {
  const [activeTab, setActiveTab] = useState('aptitude')
  const [aptitudeTopic, setAptitudeTopic] = useState('quantitative')
  const [technicalTopic, setTechnicalTopic] = useState('python')
  const [showExam, setShowExam] = useState(false)
  const [examType, setExamType] = useState('')
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [questionPages, setQuestionPages] = useState({})
  const [flipDirectionBySection, setFlipDirectionBySection] = useState({})
  const [revealedAnswers, setRevealedAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)

    const tabs = [
    { id: 'aptitude', label: 'Aptitude Questions', icon: '??' },
    { id: 'technical', label: 'Technical Questions', icon: '??' },
    { id: 'hr', label: 'HR Interview', icon: '??' },
    { id: 'resume', label: 'Resume Tips', icon: '??' },
    { id: 'interview-tips', label: 'Interview Tips', icon: '??' },
    { id: 'mock', label: 'Mock Interview', icon: '??' },
    { id: 'personality', label: 'Personality Development', icon: '??' },
    { id: 'gd', label: 'Group Discussion', icon: '??' }
  ]

  const aptitudeData = {
    quantitative: [
      { question: 'If a train travels 120 km in 2 hours, what is its speed?', answer: '60 km/h' },
      { question: 'What is 15% of 200?', answer: '30' },
      { question: 'Solve: 2x + 3 = 7', answer: 'x = 2' },
      { question: 'A number is increased by 20% and then decreased by 10%. What is the overall change?', answer: '8% increase' },
      { question: 'What percent of 480 is 72?', answer: '15%' },
      { question: 'A student scores 540 out of 900. What is the percentage?', answer: '60%' },
      { question: 'By what percent is 250 greater than 200?', answer: '25%' },
      { question: 'A number becomes 180 after a 25% increase. What is the original number?', answer: '144' },
      { question: 'A product is sold at 20% loss. If sold for ?720 more, there would be a 10% profit. Find CP.', answer: '?2400' },
      { question: 'A shopkeeper marks an item 40% above CP and gives 15% discount. Find SP.', answer: 'SP = 1.04 x CP x 0.85' },
      { question: 'A man buys a toy for ?450 and sells it for ?540. Find the gain %.', answer: '20%' },
      { question: 'A loss of ?160 is incurred when an item is sold at 20% loss. Find CP.', answer: '?800' },
      { question: 'An item is sold for ?820 at 18% profit. Find CP.', answer: '?694.92' },
      { question: 'Find SI for 3 years on ?6000 at 8% per annum.', answer: '?1440' },
      { question: 'At what rate will a sum become double in 12 years?', answer: 'Approximately 5.95%' },
      { question: 'A sum amounts to ?12,100 in 2 years at 10% CI. Find principal.', answer: '?10,000' },
      { question: 'What will be the CI on ?5000 for 2 years at 5% per annum?', answer: '?512.50' },
      { question: 'At what rate does ?8400 earn SI of ?2520 in 3 years?', answer: '10%' },
      { question: 'A alone can do a piece of work in 12 days, B in 8 days. How long together?', answer: '4.8 days' },
      { question: 'A and B together can finish a work in 15 days. A alone can do it in 20. Find B\'s time.', answer: '60 days' },
      { question: 'A, B, C can do a work in 12, 18, 24 days. How long together?', answer: '5.14 days' },
      { question: 'A and B do a work in 8 days. B and C in 12 days. A and C in 16 days. Find A\'s time alone.', answer: '19.2 days' },
      { question: 'A is twice as efficient as B. Together they finish a work in 12 days. How long B alone?', answer: '36 days' },
      { question: 'A train running at 60 km/h covers a distance in 3 hours. Find distance.', answer: '180 km' },
      { question: 'A car travels 180 km at 45 km/h. Find time.', answer: '4 hours' },
      { question: 'A man walks 20 km at 5 km/h. How long?', answer: '4 hours' },
      { question: 'Two trains 120 m and 180 m long cross each other in 12 seconds. Find speed.', answer: '25 m/s' },
      { question: 'A person reduces speed by 25% and takes 20 min more. Find original time.', answer: '80 minutes' },
      { question: 'Divide ?840 between A, B, C in ratio 2:3:4.', answer: '?168, ?252, ?420' },
      { question: 'The ratio of ages of A and B is 5:7. After 6 years, it becomes 3:4. Find current ages.', answer: 'A: 24, B: 33' },
      { question: 'In a mixture, ratio of milk to water is 3:1. If 10L water added, becomes 3:2. Find milk.', answer: '30L' },
      { question: 'A:B = 4:5, B:C = 6:7. Find A:C.', answer: '24:35' },
      { question: 'Three numbers are in ratio 2:3:5. Sum is 200. Find numbers.', answer: '40, 60, 100' },
      { question: 'Solve: 3x + 4 = 22.', answer: 'x = 6' },
      { question: 'If 2x - 3 = 9, find x.', answer: 'x = 6' },
      { question: 'Solve: x^2 - 5x + 6 = 0.', answer: 'x = 2, 3' },
      { question: 'If x : y = 2 : 3 and x + y = 25, find x.', answer: 'x = 10' },
      { question: 'Simplify: (3a + 4b) - (2a - b).', answer: 'a + 5b' },
      { question: 'Average of 5 numbers is 32. Sum of 3 numbers is 84. Find average of remaining two.', answer: '22' },
      { question: 'Average of 20 students is 45. One student score 80 replaced by 40. Find new average.', answer: '44' },
      { question: 'A man travels 3 hours at 60 km/h and 2 hours at 40 km/h. Find average speed.', answer: '52 km/h' },
      { question: 'Average age of 4 persons is 28. New person joins; average is 27. Find new person\'s age.', answer: '23' },
      { question: 'Average of first 10 natural numbers?', answer: '5.5' }
    ],
    logical: [
      { question: 'Find the odd one out: Apple, Banana, Carrot, Orange', answer: 'Carrot (vegetable)' },
      { question: 'If A is taller than B, and B is taller than C, who is the shortest?', answer: 'C' },
      { question: '2, 6, 12, 20, 30, ?', answer: '42' },
      { question: '7, 14, 28, 56, ?', answer: '112' },
      { question: '3, 5, 9, 17, 33, ?', answer: '65' },
      { question: '11, 13, 17, 19, 23, ?', answer: '29' },
      { question: '1, 4, 9, 16, 25, ?', answer: '36' },
      { question: 'A, C, F, J, O, ?', answer: 'U' },
      { question: 'D, F, I, M, R, ?', answer: 'W' },
      { question: 'Z, X, U, Q, L, ?', answer: 'G' },
      { question: 'B, D, G, K, P, ?', answer: 'W' },
      { question: 'K, L, N, Q, U, ?', answer: 'Z' },
      { question: 'A person walks 10 m east, 5 m south, 10 m west. Which direction from start?', answer: 'South' },
      { question: 'A man walks 30 m north, then 40 m east. How far from starting point?', answer: '50 m' },
      { question: 'A person turns right, then left, then 180 degrees. What direction facing?', answer: 'North' },
      { question: 'A boy walks south 12 m and west 16 m. Find shortest distance.', answer: '20 m' },
      { question: 'A man walks east 15 m, north 8 m, west 15 m. Where is he now?', answer: '8 m north' },
      { question: 'A is father of B. B is brother of C. How is C related to A?', answer: 'Son/Daughter' },
      { question: 'P is sister of Q. Q is son of R. How is P related to R?', answer: 'Daughter' },
      { question: 'A is daughter of B. B is brother of C. C is mother of D. How is A related to D?', answer: 'Cousin' },
      { question: 'X is father of Y. Y is mother of Z. How is X related to Z?', answer: 'Grandfather' },
      { question: 'H is wife of K. K is brother of L. L is daughter of M. How is H related to M?', answer: 'Daughter-in-law' },
      { question: 'Pen : Write :: Knife : ?', answer: 'Cut' },
      { question: 'Bird : Fly :: Fish : ?', answer: 'Swim' },
      { question: 'Hot : Cold :: Fast : ?', answer: 'Slow' },
      { question: 'Plant : Photosynthesis :: Human : ?', answer: 'Respiration' },
      { question: 'Ear : Hear :: Eye : ?', answer: 'See' },
      { question: 'Mango, Apple, Banana, Potato', answer: 'Potato (vegetable)' },
      { question: 'Dog, Cat, Cow, Table', answer: 'Table (not animal)' },
      { question: 'Circle, Square, Triangle, Cube', answer: 'Cube (3D shape)' },
      { question: 'Blue, Red, Yellow, Stone', answer: 'Stone (not color)' },
      { question: 'Bus, Train, Car, Bed', answer: 'Bed (not vehicle)' }
    ],
    verbal: [
      { question: 'Choose the synonym of "Happy"', answer: 'Joyful' },
      { question: 'Complete the analogy: Book is to Library as Painting is to ___', answer: 'Museum' },
      { question: 'Choose synonym of Rapid.', answer: 'Quick' },
      { question: 'Choose synonym of Brave.', answer: 'Courageous' },
      { question: 'Choose synonym of Calm.', answer: 'Peaceful' },
      { question: 'Choose synonym of Bright.', answer: 'Intelligent' },
      { question: 'Choose synonym of Happy.', answer: 'Joyful' },
      { question: 'Choose antonym of Strong.', answer: 'Weak' },
      { question: 'Choose antonym of Possible.', answer: 'Impossible' },
      { question: 'Choose antonym of Heavy.', answer: 'Light' },
      { question: 'Choose antonym of Accept.', answer: 'Reject' },
      { question: 'Choose antonym of Safe.', answer: 'Dangerous' },
      { question: 'He _____ home yesterday.', answer: 'went' },
      { question: 'She will come _____ you call her.', answer: 'if' },
      { question: 'They _____ playing when I arrived.', answer: 'were' },
      { question: 'I want _____ cup of tea.', answer: 'a' },
      { question: 'She is good _____ English.', answer: 'at' },
      { question: 'He don\'t know the answer.', answer: 'doesn\'t' },
      { question: 'She is senior than me.', answer: 'senior to' },
      { question: 'They goes to school daily.', answer: 'go' },
      { question: 'He did not went to market.', answer: 'go' },
      { question: 'I am having two brothers.', answer: 'have' },
      { question: 'What is the main idea of a passage?', answer: 'Central theme' },
      { question: 'What is the author trying to explain?', answer: 'Purpose' },
      { question: 'What is the meaning of the word used in the passage?', answer: 'Definition' },
      { question: 'What is the conclusion from the paragraph?', answer: 'Inference' },
      { question: 'Which statement is true based on the passage?', answer: 'Fact checking' },
      { question: 'Form a sentence using Although.', answer: 'Although it was raining, we went out.' },
      { question: 'Form a sentence using Because.', answer: 'I stayed home because I was sick.' },
      { question: 'Rewrite the sentence in passive voice.', answer: 'The work was done by him.' },
      { question: 'Change direct speech to indirect speech.', answer: 'He said that he was tired.' },
      { question: 'Form a meaningful sentence using: success, hard work, achieve.', answer: 'Success can be achieved through hard work.' }
    ]
  }

  const technicalData = {
    python: [
      { question: 'What are Python\'s key features?', answer: 'Easy to learn, interpreted, object-oriented, dynamic typing, extensive libraries' },
      { question: 'Difference between Python 2 and Python 3?', answer: 'Python 3 has better Unicode support, print function, integer division, and improved syntax' },
      { question: 'Explain Python\'s memory management.', answer: 'Uses reference counting and garbage collection, automatic memory management' },
      { question: 'What are Python\'s data types?', answer: 'int, float, str, bool, list, tuple, dict, set, frozenset' },
      { question: 'Difference between list, tuple, and set.', answer: 'List: mutable, ordered; Tuple: immutable, ordered; Set: mutable, unordered, unique elements' },
      { question: 'What is Python decorator?', answer: 'Function that modifies another function\'s behavior without changing its code' },
      { question: 'Explain Python generators and iterators.', answer: 'Iterators: objects with __iter__ and __next__; Generators: functions using yield' },
      { question: 'How is Python interpreted?', answer: 'Python code is compiled to bytecode and executed by Python Virtual Machine' },
      { question: 'Difference between deep copy and shallow copy.', answer: 'Shallow copy: copies references; Deep copy: creates new objects recursively' },
      { question: 'Explain Python\'s GIL.', answer: 'Global Interpreter Lock prevents multiple threads from executing Python code simultaneously' },
      { question: 'How to handle exceptions in Python?', answer: 'Using try-except blocks, finally clause, raise statement' },
      { question: 'What are Python modules and packages?', answer: 'Modules: .py files; Packages: directories with __init__.py containing modules' },
      { question: 'Explain Python\'s with statement.', answer: 'Context manager for resource management, ensures cleanup' },
      { question: 'Difference between Python class and instance variables.', answer: 'Class variables: shared by all instances; Instance variables: unique to each instance' },
      { question: 'What is Python\'s lambda function?', answer: 'Anonymous function created with lambda keyword for simple operations' },
      { question: 'Difference between Python functions and methods.', answer: 'Functions: standalone; Methods: functions defined inside classes' },
      { question: 'How to read/write files in Python?', answer: 'Using open() function with read/write modes, file objects' },
      { question: 'What is Python\'s comprehension?', answer: 'Concise way to create lists, dicts, sets using expressions' },
      { question: 'Explain Python\'s multithreading and multiprocessing.', answer: 'Multithreading: concurrent execution; Multiprocessing: parallel execution using multiple processes' },
      { question: 'Difference between Python dictionary and JSON.', answer: 'Dict: Python data structure; JSON: text format for data interchange' }
    ],
    java: [
      { question: 'Difference between JDK, JRE, and JVM.', answer: 'JDK: development kit; JRE: runtime environment; JVM: virtual machine' },
      { question: 'Explain Object-Oriented Programming concepts in Java.', answer: 'Encapsulation, Inheritance, Polymorphism, Abstraction' },
      { question: 'Difference between abstract class and interface.', answer: 'Abstract class: partial implementation; Interface: contract with no implementation' },
      { question: 'What are Java access modifiers?', answer: 'public, private, protected, default (package-private)' },
      { question: 'Difference between == and equals() in Java.', answer: '== compares references; equals() compares content' },
      { question: 'Explain Java\'s garbage collection.', answer: 'Automatic memory management, removes unused objects' },
      { question: 'What is the difference between String, StringBuilder, and StringBuffer?', answer: 'String: immutable; StringBuilder: mutable, not thread-safe; StringBuffer: mutable, thread-safe' },
      { question: 'Explain Java Collections Framework.', answer: 'Unified architecture for storing and manipulating groups of objects' },
      { question: 'Difference between HashMap and TreeMap.', answer: 'HashMap: unordered, O(1) access; TreeMap: ordered, O(log n) access' },
      { question: 'Explain Java exception handling.', answer: 'Using try-catch-finally blocks, throw and throws keywords' },
      { question: 'What is polymorphism in Java?', answer: 'Ability of an object to take many forms through inheritance and interfaces' },
      { question: 'Difference between overloading and overriding.', answer: 'Overloading: same method name, different parameters; Overriding: same method signature in subclass' },
      { question: 'What is a static block in Java?', answer: 'Code block executed when class is loaded, before main method' },
      { question: 'Explain the final keyword in Java.', answer: 'Makes variables, methods, classes unchangeable' },
      { question: 'Difference between checked and unchecked exceptions.', answer: 'Checked: checked at compile time; Unchecked: runtime exceptions' },
      { question: 'What is multithreading in Java?', answer: 'Concurrent execution of multiple threads within a program' },
      { question: 'Explain synchronization in Java.', answer: 'Controls access to shared resources by multiple threads' },
      { question: 'Difference between wait() and sleep().', answer: 'wait(): releases lock; sleep(): holds lock for specified time' },
      { question: 'Explain the significance of Java 8 features like Streams and Lambdas.', answer: 'Functional programming support, improved collections processing' },
      { question: 'How to handle files in Java?', answer: 'Using File, FileReader, FileWriter, BufferedReader classes' }
    ],
    javascript: [
      { question: 'Difference between var, let, and const.', answer: 'var: function scope; let/const: block scope, const cannot be reassigned' },
      { question: 'Explain JavaScript data types.', answer: 'Primitive: string, number, boolean, undefined, null, symbol; Object: arrays, functions, objects' },
      { question: 'What is closure in JavaScript?', answer: 'Function that remembers its outer scope variables' },
      { question: 'Difference between == and ===.', answer: '== loose equality with type coercion; === strict equality without type coercion' },
      { question: 'What is hoisting in JavaScript?', answer: 'Moving variable and function declarations to the top of their scope' },
      { question: 'Explain callback functions.', answer: 'Functions passed as arguments to other functions, executed later' },
      { question: 'What is the difference between synchronous and asynchronous programming?', answer: 'Sync: blocking operations; Async: non-blocking, uses callbacks/promises' },
      { question: 'Explain promises in JavaScript.', answer: 'Objects representing completion/failure of async operations' },
      { question: 'What is async/await?', answer: 'Syntactic sugar for promises, makes async code look synchronous' },
      { question: 'Difference between null and undefined.', answer: 'null: intentional absence; undefined: uninitialized variable' },
      { question: 'Explain the difference between function declaration and expression.', answer: 'Declaration: hoisted; Expression: not hoisted, assigned to variable' },
      { question: 'What are JavaScript events?', answer: 'Actions that occur in the browser, like clicks, keypresses' },
      { question: 'Difference between call, apply, and bind.', answer: 'call/apply: invoke function with specific this; bind: returns new function with bound this' },
      { question: 'Explain the concept of prototype in JavaScript.', answer: 'Mechanism for object inheritance and property sharing' },
      { question: 'What is event bubbling and capturing?', answer: 'Bubbling: event propagates up; Capturing: event propagates down' },
      { question: 'Difference between arrow function and normal function.', answer: 'Arrow: no this binding, shorter syntax; Normal: has this binding' },
      { question: 'What is the DOM?', answer: 'Document Object Model - programming interface for HTML documents' },
      { question: 'Explain localStorage, sessionStorage, and cookies.', answer: 'localStorage: persistent storage; sessionStorage: session storage; cookies: small data sent to server' },
      { question: 'Difference between ES5 and ES6.', answer: 'ES6: arrow functions, classes, modules, promises, let/const' },
      { question: 'Explain JavaScript modules.', answer: 'Way to organize and reuse code, using import/export' }
    ],
    sql: [
      { question: 'Difference between SQL and NoSQL.', answer: 'SQL: relational, structured; NoSQL: non-relational, flexible schema' },
      { question: 'Explain different types of joins.', answer: 'INNER, LEFT, RIGHT, FULL OUTER, CROSS joins' },
      { question: 'What is normalization and denormalization?', answer: 'Normalization: reduce redundancy; Denormalization: improve read performance' },
      { question: 'Difference between primary key and foreign key.', answer: 'Primary key: unique identifier; Foreign key: references primary key in another table' },
      { question: 'Explain indexes in SQL.', answer: 'Data structures that improve query performance' },
      { question: 'Difference between clustered and non-clustered index.', answer: 'Clustered: sorts table data; Non-clustered: separate index structure' },
      { question: 'What are transactions in SQL?', answer: 'Sequence of operations treated as single unit of work' },
      { question: 'Explain ACID properties.', answer: 'Atomicity, Consistency, Isolation, Durability' },
      { question: 'What is a stored procedure?', answer: 'Precompiled SQL code stored in database' },
      { question: 'Difference between UNION and UNION ALL.', answer: 'UNION: removes duplicates; UNION ALL: keeps duplicates' },
      { question: 'Difference between TRUNCATE, DELETE, and DROP.', answer: 'TRUNCATE: removes all rows; DELETE: removes specific rows; DROP: removes table' },
      { question: 'Explain subqueries.', answer: 'Queries nested inside another query' },
      { question: 'Difference between CHAR and VARCHAR.', answer: 'CHAR: fixed length; VARCHAR: variable length' },
      { question: 'What is a view in SQL?', answer: 'Virtual table based on result of SQL statement' },
      { question: 'Explain SQL constraints.', answer: 'Rules enforced on data columns: PRIMARY KEY, FOREIGN KEY, UNIQUE, NOT NULL, CHECK' },
      { question: 'Difference between inner join and outer join.', answer: 'Inner: matching rows only; Outer: all rows from one table and matching from other' },
      { question: 'How to find duplicate records in a table?', answer: 'Using GROUP BY and HAVING COUNT(*) > 1' },
      { question: 'Explain primary key vs unique key.', answer: 'Primary key: one per table, not null; Unique key: can be multiple, allows null' },
      { question: 'What is a trigger?', answer: 'SQL code that automatically executes in response to database events' },
      { question: 'Difference between temporary table and normal table.', answer: 'Temporary: session-specific; Normal: persistent' }
    ],
    devops: [
      { question: 'What is DevOps?', answer: 'Culture, practices, tools that combine software development and IT operations' },
      { question: 'Difference between CI/CD.', answer: 'CI: continuous integration; CD: continuous delivery/deployment' },
      { question: 'What are some DevOps tools?', answer: 'Jenkins, Docker, Kubernetes, Ansible, Git, Terraform, Prometheus' },
      { question: 'Explain Jenkins pipeline.', answer: 'Automated workflow for building, testing, deploying software' },
      { question: 'Difference between Git pull and Git fetch.', answer: 'pull: fetch and merge; fetch: download changes without merging' },
      { question: 'Explain containerization.', answer: 'Packaging application with dependencies into isolated containers' },
      { question: 'Difference between Docker and VM.', answer: 'Docker: OS-level virtualization; VM: hardware-level virtualization' },
      { question: 'What is Kubernetes?', answer: 'Container orchestration platform for automating deployment and scaling' },
      { question: 'Explain Dockerfile.', answer: 'Text file with instructions to build Docker image' },
      { question: 'How to monitor applications in DevOps?', answer: 'Using tools like Prometheus, Grafana, ELK stack, Nagios' },
      { question: 'Difference between Ansible and Puppet.', answer: 'Ansible: agentless, uses SSH; Puppet: agent-based, uses Ruby DSL' },
      { question: 'What is configuration management?', answer: 'Process of maintaining consistent system configurations' },
      { question: 'Explain blue-green deployment.', answer: 'Two identical environments, switch traffic between them for zero-downtime deployment' },
      { question: 'Difference between Git merge and rebase.', answer: 'merge: creates merge commit; rebase: rewrites history linearly' },
      { question: 'What is CI/CD pipeline in real-time?', answer: 'Automated process from code commit to production deployment' },
      { question: 'Explain rollback strategy in DevOps.', answer: 'Plan to revert to previous working version if deployment fails' },
      { question: 'How to handle secrets in DevOps?', answer: 'Using tools like Vault, AWS Secrets Manager, encrypted environment variables' },
      { question: 'What is microservices architecture?', answer: 'Application built as collection of small, independent services' },
      { question: 'Explain the concept of infrastructure as code.', answer: 'Managing infrastructure using code and version control' },
      { question: 'What is a build tool?', answer: 'Software that automates compilation and packaging of code' }
    ],
    sap: [
      { question: 'What is SAP?', answer: 'Enterprise resource planning software for managing business processes' },
      { question: 'Explain SAP modules.', answer: 'FI (Finance), CO (Controlling), MM (Materials Management), SD (Sales & Distribution), HR (Human Resources)' },
      { question: 'Difference between SAP FI and CO.', answer: 'FI: external accounting; CO: internal cost accounting and management' },
      { question: 'What is SAP HANA?', answer: 'In-memory database platform for high-performance analytics' },
      { question: 'Difference between SAP ERP and SAP S/4HANA.', answer: 'S/4HANA: next-generation ERP with simplified data model and HANA database' },
      { question: 'What is a client in SAP?', answer: 'Independent unit within SAP system with separate master data and transactions' },
      { question: 'Explain SAP MM module.', answer: 'Manages procurement, inventory, vendor management, material requirements planning' },
      { question: 'Explain SAP SD module.', answer: 'Handles sales orders, pricing, billing, shipping, credit management' },
      { question: 'Difference between OLTP and OLAP.', answer: 'OLTP: operational processing; OLAP: analytical processing for reporting' },
      { question: 'What is ABAP in SAP?', answer: 'Advanced Business Application Programming - SAP\'s programming language' },
      { question: 'Explain SAP FICO integration.', answer: 'Integration between Financial Accounting (FI) and Controlling (CO) modules' },
      { question: 'What are SAP tables?', answer: 'Database tables storing SAP data - transparent, pooled, cluster tables' },
      { question: 'Explain SAP HR module.', answer: 'Manages employee data, payroll, time management, organizational management' },
      { question: 'Difference between SAP BAPI and BADI.', answer: 'BAPI: business application programming interface; BADI: business add-in for enhancements' },
      { question: 'Explain SAP workflow.', answer: 'Automated business processes with approval mechanisms and notifications' },
      { question: 'What is SAP UI5?', answer: 'JavaScript framework for developing responsive web applications' },
      { question: 'Explain SAP security concept.', answer: 'Authorization concepts, user management, role-based access control' },
      { question: 'Difference between master data and transactional data.', answer: 'Master data: static reference data; Transactional data: dynamic business transactions' },
      { question: 'What is SAP transport request?', answer: 'Container for transporting changes between SAP systems' },
      { question: 'Explain SAP configuration vs customization.', answer: 'Configuration: using standard functionality; Customization: modifying standard code' }
    ],
    'digital-marketing': [
      { question: 'What is SEO?', answer: 'Search Engine Optimization - improving website visibility in search results' },
      { question: 'Difference between on-page and off-page SEO.', answer: 'On-page: content and HTML; Off-page: external links and social signals' },
      { question: 'Explain Google Ads.', answer: 'Pay-per-click advertising platform for promoting businesses on Google' },
      { question: 'What is CTR?', answer: 'Click-Through Rate - percentage of users who click on ad or link' },
      { question: 'Difference between organic and paid traffic.', answer: 'Organic: natural search results; Paid: advertising campaigns' },
      { question: 'What is SEM?', answer: 'Search Engine Marketing - paid advertising on search engines' },
      { question: 'Explain backlinks.', answer: 'Links from other websites pointing to your site, important for SEO' },
      { question: 'What is keyword research?', answer: 'Process of finding and analyzing search terms people use' },
      { question: 'Difference between CPC and CPM.', answer: 'CPC: cost per click; CPM: cost per thousand impressions' },
      { question: 'Explain Google Analytics.', answer: 'Web analytics tool for tracking website traffic and user behavior' },
      { question: 'What is conversion rate?', answer: 'Percentage of visitors who complete desired action' },
      { question: 'Difference between social media marketing and email marketing.', answer: 'Social: platforms like Facebook, Twitter; Email: direct communication via email' },
      { question: 'What is content marketing?', answer: 'Creating and distributing valuable content to attract target audience' },
      { question: 'What is affiliate marketing?', answer: 'Performance-based marketing where affiliates earn commission for sales' },
      { question: 'Difference between black hat and white hat SEO.', answer: 'White hat: ethical practices; Black hat: manipulative techniques' },
      { question: 'What is remarketing?', answer: 'Showing ads to people who previously visited your website' },
      { question: 'Explain lead generation.', answer: 'Process of attracting and converting strangers into potential customers' },
      { question: 'What is a landing page?', answer: 'Standalone web page created for specific marketing campaign' },
      { question: 'What is A/B testing in marketing?', answer: 'Comparing two versions of content to see which performs better' },
      { question: 'Difference between impressions and reach.', answer: 'Impressions: number of times ad displayed; Reach: number of unique users who saw ad' }
    ],
    'general-technical-hr': [
      { question: 'Tell me about yourself.', answer: 'Professional introduction highlighting background, skills, and career goals' },
      { question: 'What are your strengths and weaknesses?', answer: 'Strengths: relevant skills; Weaknesses: areas for improvement with positive spin' },
      { question: 'Why should we hire you?', answer: 'Highlight unique value proposition and fit for the role' },
      { question: 'Why do you want to work here?', answer: 'Research company values, culture, and opportunities' },
      { question: 'Where do you see yourself in 5 years?', answer: 'Show ambition and long-term commitment to career growth' },
      { question: 'Explain a challenging situation you handled.', answer: 'Use STAR method: Situation, Task, Action, Result' },
      { question: 'How do you handle stress at work?', answer: 'Time management, prioritization, seeking support, work-life balance' },
      { question: 'Describe your ideal work environment.', answer: 'Collaborative, challenging, growth-oriented, aligned with company culture' },
      { question: 'Why did you leave your last job?', answer: 'Focus on positive reasons: career growth, new challenges, company changes' },
      { question: 'What motivates you?', answer: 'Learning opportunities, challenging projects, recognition, making impact' },
      { question: 'How do you prioritize work?', answer: 'Urgency, importance, deadlines, stakeholder impact' },
      { question: 'Explain a time you worked in a team.', answer: 'Highlight collaboration, communication, conflict resolution' },
      { question: 'How do you handle conflicts with colleagues?', answer: 'Open communication, understanding perspectives, finding common ground' },
      { question: 'Describe your greatest achievement.', answer: 'Quantifiable accomplishment with impact and lessons learned' },
      { question: 'How do you handle criticism?', answer: 'Listen actively, reflect, use feedback for improvement' },
      { question: 'Are you willing to relocate?', answer: 'Depends on situation - express openness and discuss logistics' },
      { question: 'What is your salary expectation?', answer: 'Research market rates, provide range, focus on total compensation' },
      { question: 'Are you comfortable with deadlines?', answer: 'Yes, thrive under pressure, use time management skills' },
      { question: 'How do you stay updated with industry trends?', answer: 'Online courses, conferences, blogs, professional networks' },
      { question: 'Do you have any questions for us?', answer: 'Always prepare thoughtful questions about role, team, company' }
    ]
  }

  const hrQuestions = [
    { question: 'Tell me about yourself.', tips: 'Provide a brief professional introduction highlighting your background, key skills, and career goals' },
    { question: 'Walk me through your resume.', tips: 'Summarize your career progression, key achievements, and relevant experience' },
    { question: 'What are your strengths?', tips: 'Focus on 2-3 key strengths with specific examples and how they benefit the role' },
    { question: 'What are your weaknesses?', tips: 'Choose a genuine weakness and explain how you\'re working to improve it' },
    { question: 'Why do you want to work in this company?', tips: 'Research the company thoroughly and connect their values/mission with your career goals' },
    { question: 'Why should we hire you?', tips: 'Highlight your unique value proposition, relevant skills, and enthusiasm for the role' },
    { question: 'Where do you see yourself in 5 years?', tips: 'Show ambition and long-term commitment while being realistic about career progression' },
    { question: 'What are your short-term and long-term goals?', tips: 'Align your goals with the company\'s growth and demonstrate strategic thinking' },
    { question: 'Why did you leave your previous job (or why do you want to leave your current job)?', tips: 'Focus on positive reasons like career growth, new challenges, or company changes' },
    { question: 'Describe a challenging situation you faced and how you handled it.', tips: 'Use STAR method: Situation, Task, Action, Result. Show problem-solving skills' },
    { question: 'How do you handle stress or pressure at work?', tips: 'Discuss time management, prioritization, seeking support, and maintaining work-life balance' },
    { question: 'Describe a time you worked successfully in a team.', tips: 'Highlight collaboration, communication, conflict resolution, and your specific contributions' },
    { question: 'How do you handle conflicts with colleagues or supervisors?', tips: 'Emphasize open communication, understanding different perspectives, and finding solutions' },
    { question: 'What motivates you to do your best work?', tips: 'Mention learning opportunities, challenging projects, recognition, or making a positive impact' },
    { question: 'Tell me about a failure you experienced and what you learned from it.', tips: 'Choose a genuine failure, focus on lessons learned, and how you applied them moving forward' },
    { question: 'How do you prioritize tasks when you have multiple deadlines?', tips: 'Discuss using urgency, importance, stakeholder impact, and effective time management' },
    { question: 'Are you willing to relocate or travel for work?', tips: 'Be honest about your flexibility and discuss any constraints or requirements' },
    { question: 'What is your expected salary?', tips: 'Research market rates, provide a range, and focus on total compensation package' },
    { question: 'How do you stay updated with industry trends?', tips: 'Mention online courses, conferences, blogs, professional networks, and continuous learning' },
    { question: 'Do you have any questions for us?', tips: 'Always prepare thoughtful questions about the role, team, company culture, and growth opportunities' }
  ]

  const resumeTips = [
    'Keep it to 1-2 pages',
    'Use action verbs',
    'Quantify achievements',
    'Tailor for each job',
    'Proofread multiple times'
  ]

  const interviewTips = [
    {
      category: 'Before the Interview',
      tips: [
        'Test your internet connection, microphone, and camera in advance',
        'Choose a quiet, well-lit space with a neutral background',
        'Keep all documents and resume handy on your computer',
        'Reach the venue 10-15 minutes early',
        'Know the location and travel time',
        'Carry multiple copies of your resume and portfolio'
      ]
    },
    {
      category: 'Dress Code',
      tips: [
        'Wear professional attire regardless of online/offline mode',
        'Avoid bright, flashy colors for online interviews (camera can exaggerate)',
        'Ensure neat grooming: hair, nails, shoes, accessories'
      ]
    },
    {
      category: 'Body Language & Presentation',
      tips: [
        'Sit upright, maintain eye contact by looking at the camera, not the screen',
        'Avoid fidgeting or looking around',
        'Use subtle hand gestures naturally',
        'Offer a firm handshake if culturally appropriate',
        'Maintain good posture and direct eye contact',
        'Smile naturally to show confidence'
      ]
    },
    {
      category: 'Communication',
      tips: [
        'Speak clearly, slowly, and confidently',
        'Avoid filler words like "um" or "like"',
        'Pause to think if needed, especially for tricky questions',
        'For online, mute notifications and silence your phone'
      ]
    },
    {
      category: 'Technical & Behavioral Preparation',
      tips: [
        'Prepare answers using STAR method for behavioral questions',
        'Review domain-specific knowledge and projects',
        'Be ready to share your screen for coding or project demos in online interviews'
      ]
    },
    {
      category: 'Handling Questions',
      tips: [
        'Listen carefully, don\'t interrupt',
        'If you don\'t know an answer, admit honestly but show willingness to learn',
        'Use examples from work, academics, or personal projects'
      ]
    },
    {
      category: 'Asking Questions',
      tips: [
        'Prepare 3-5 questions to ask the interviewer',
        'Role expectations, team structure, company culture, growth opportunities',
        'For online, ask politely using chat or voice; for offline, ask confidently in person'
      ]
    },
    {
      category: 'Technical Setup (Online Specific)',
      tips: [
        'Use a reliable platform (Zoom, Teams, Google Meet)',
        'Keep backup device ready if possible',
        'Check camera angle, lighting, and audio clarity'
      ]
    },
    {
      category: 'Etiquette',
      tips: [
        'Online: Join the meeting 5-10 minutes early',
        'Online: Avoid background noise or interruptions',
        'Online: Use full name and professional username in the meeting',
        'Offline: Greet politely at reception',
        'Offline: Wait for the interviewer to invite you to sit',
        'Offline: Turn off your phone'
      ]
    },
    {
      category: 'Follow-Up',
      tips: [
        'Send a thank-you email within 24 hours, regardless of online/offline',
        'Mention specific discussion points to reinforce interest'
      ]
    }
  ]

  const mockInterview = [
    { role: 'Software Developer', questions: ['Explain OOP concepts', 'Debug this code', 'System design question'] },
    { role: 'Data Analyst', questions: ['SQL query optimization', 'Data visualization', 'Statistical analysis'] },
    { role: 'Project Manager', questions: ['Agile methodology', 'Risk management', 'Team leadership'] }
  ]

  const companyQuestions = {
    infosys: ['Tell me about Infosys values', 'Why Infosys?', 'Technical scenario questions'],
    tcs: ['TCS culture fit', 'Innovation examples', 'Problem-solving approach'],
    accenture: ['Consulting mindset', 'Client interaction', 'Digital transformation']
  }

  const personalityDev = [
    'Active listening skills',
    'Emotional intelligence',
    'Time management',
    'Adaptability',
    'Leadership qualities'
  ]

  const gdTopics = [
    'Impact of social media on youth',
    'Work from home vs office',
    'Electric vehicles future',
    'Cryptocurrency regulation',
    'Climate change solutions'
  ]

  const pythonQuestions = [
    {
      question: 'What will be the output?',
      code: 'x = 10\ndef func():\n    print(x)\n    x = x + 1\nfunc()',
      options: ['a) 10', 'b) 11', 'c) UnboundLocalError', 'd) NameError'],
      correct: 'c'
    },
    {
      question: 'What is the result?',
      code: 'a = [1, 2, 3]\nb = a[:]\nb.append(4)\nprint(a, b)',
      options: ['a) [1,2,3] [1,2,3]', 'b) [1,2,3] [1,2,3,4]', 'c) [1,2,3,4] [1,2,3,4]', 'd) Error'],
      correct: 'b'
    },
    {
      question: 'What does this generator output?',
      code: 'def g():\n    for i in range(3):\n        yield i\n        i += 10\nprint(list(g()))',
      options: ['a) [0,1,2]', 'b) [10,11,12]', 'c) [0,11,22]', 'd) [0,1,2,10,11,12]'],
      correct: 'a'
    },
    {
      question: 'Which is TRUE about Python memory model?',
      options: ['a) Everything is stored on heap', 'b) Only lists and dicts are stored on heap', 'c) Immutable objects stored in stack', 'd) CPython stores small integers in an internal cache'],
      correct: 'd'
    },
    {
      question: 'What will this code print?',
      code: 'def f(x, y=[]):\n    y.append(x)\n    return y\nprint(f(1), f(2))',
      options: ['a) [1] [2]', 'b) [1] [1,2]', 'c) [1,2] [1,2]', 'd) Error'],
      correct: 'b'
    },
    {
      question: 'What will be printed?',
      code: 'class A:\n    def __init__(self):\n        self.x = 10\na = A()\nb = A()\na.x += 5\nprint(a.x, b.x)',
      options: ['a) 15 10', 'b) 10 10', 'c) 15 15', 'd) Error'],
      correct: 'a'
    },
    {
      question: 'What does this code do?',
      code: 'class A: pass\na = A()\na.val = 100\nb = A()\nprint(hasattr(b, "val"))',
      options: ['a) True', 'b) False', 'c) 100', 'd) Error'],
      correct: 'b'
    },
    {
      question: 'What does this code do?',
      code: 'for i in range(3):\n    lambda: i',
      options: ['a) Creates new function objects each storing different i', 'b) All lambdas reference same final i', 'c) Syntax error', 'd) None are created'],
      correct: 'b'
    },
    {
      question: 'Output?',
      code: 'x = 1\ndef outer():\n    x = 2\n    def inner():\n        nonlocal x\n        x += 1\n        return x\n    return inner()\nprint(outer())',
      options: ['a) 1', 'b) 2', 'c) 3', 'd) Error'],
      correct: 'c'
    },
    {
      question: 'Which statement about GIL is TRUE?',
      options: ['a) Prevents multi-threading always', 'b) Allows only one thread to execute Python bytecode at a time', 'c) Affects multiprocessing', 'd) Exists in all Python implementations'],
      correct: 'b'
    },
    {
      question: 'What is the complexity of searching an element in a Python set?',
      options: ['a) O(n)', 'b) O(1) average', 'c) O(log n)', 'd) O(n log n)'],
      correct: 'b'
    },
    {
      question: 'What will this code print?',
      code: 'def func(a, b, *, c):\n    return a + b + c\nprint(func(1,2,3))',
      options: ['a) 6', 'b) 1 2 3', 'c) TypeError', 'd) 3'],
      correct: 'c'
    },
    {
      question: 'Output?',
      code: 'import functools\ndef add(x, y):\n    return x + y\nf = functools.partial(add, 10)\nprint(f(5))',
      options: ['a) 10', 'b) 5', 'c) 15', 'd) Error'],
      correct: 'c'
    },
    {
      question: 'What will be the output?',
      code: 'def f():\n    try:\n        return 1\n    finally:\n        return 2\nprint(f())',
      options: ['a) 1', 'b) 2', 'c) None', 'd) Error'],
      correct: 'b'
    },
    {
      question: 'What will be the output?',
      code: 'x = (i*i for i in range(4))\nprint(next(x), next(x), list(x))',
      options: ['a) 0 1 [4,9]', 'b) 1 4 [9,16]', 'c) 0 1 [1,4,9]', 'd) Error'],
      correct: 'a'
    },
    {
      question: 'Output?',
      code: 'a = (1,2,3)\nb = (1,2,3)\nprint(a is b)',
      options: ['a) True', 'b) False', 'c) Depends on CPython optimization', 'd) Error'],
      correct: 'c'
    },
    {
      question: 'Python decorated functions are implemented using:',
      options: ['a) Inheritance', 'b) Polymorphism', 'c) Closures', 'd) Metaclasses'],
      correct: 'c'
    },
    {
      question: 'What is the output?',
      code: 'def f():\n    pass\nprint(f() == None)',
      options: ['a) True', 'b) False', 'c) Error', 'd) None'],
      correct: 'a'
    },
    {
      question: 'Which module provides atomic operations for threads?',
      options: ['a) threading', 'b) multiprocessing', 'c) concurrent.futures', 'd) _thread'],
      correct: 'd'
    },
    {
      question: 'Output?',
      code: 'a = [1,2,3]\nb = a\na = a + [4]\nprint(a, b)',
      options: ['a) [1,2,3,4] [1,2,3]', 'b) [1,2,3,4] [1,2,3,4]', 'c) [1,2,3] [1,2,3,4]', 'd) Error'],
      correct: 'a'
    }
  ]

  const sqlQuestions = [
    {
      question: 'Which of the following executes first in SQL query execution order?',
      options: ['a) SELECT', 'b) FROM', 'c) WHERE', 'd) GROUP BY'],
      correct: 'b'
    },
    {
      question: 'What is the correct way to get 3rd highest salary from Employee table?',
      options: ['a) SELECT MAX(salary) FROM Employee;', 'b) SELECT salary FROM Employee ORDER BY salary DESC LIMIT 1 OFFSET 2;', 'c) SELECT TOP 3 salary FROM Employee;', 'd) SELECT DISTINCT salary FROM Employee;'],
      correct: 'b'
    },
    {
      question: 'Which statement is TRUE about a composite key?',
      options: ['a) Combines multiple tables', 'b) Combines multiple columns in a table', 'c) Combines primary and foreign keys', 'd) Multi-index key'],
      correct: 'b'
    },
    {
      question: 'Which join returns all rows from left table, matched or not?',
      options: ['a) INNER JOIN', 'b) LEFT JOIN', 'c) RIGHT JOIN', 'd) CROSS JOIN'],
      correct: 'b'
    },
    {
      question: 'Output of below query if Employee table has 10 rows and 3 have NULL salaries?',
      code: 'SELECT COUNT(salary) FROM Employee;',
      options: ['a) 10', 'b) 3', 'c) 7', 'd) 0'],
      correct: 'c'
    },
    {
      question: 'Which SQL construct is used to filter after aggregation?',
      options: ['a) WHERE', 'b) HAVING', 'c) GROUP BY', 'd) ORDER BY'],
      correct: 'b'
    },
    {
      question: 'Which SQL clause is used for window functions?',
      options: ['a) OVER()', 'b) PARTITION BY', 'c) ORDER BY', 'd) All of the above'],
      correct: 'd'
    },
    {
      question: 'What happens if you create a unique index on a column with duplicate values?',
      options: ['a) Index is created', 'b) Error', 'c) Only first value is indexed', 'd) Duplicates are removed automatically'],
      correct: 'b'
    },
    {
      question: 'ACID property that ensures a transaction either fully completes or fully rolls back?',
      options: ['a) Atomicity', 'b) Consistency', 'c) Isolation', 'd) Durability'],
      correct: 'a'
    },
    {
      question: 'Output of below query if Employee table has NULLs in department_id?',
      code: 'SELECT department_id, COUNT(*) FROM Employee GROUP BY department_id;',
      options: ['a) NULL will be counted as a group', 'b) NULLs are ignored', 'c) Query fails', 'd) Count = 0'],
      correct: 'a'
    },
    {
      question: 'Which statement about indexes is TRUE?',
      options: ['a) Speeds up SELECT', 'b) Slows INSERT/UPDATE', 'c) Uses extra storage', 'd) All of the above'],
      correct: 'd'
    },
    {
      question: 'Which join returns only rows that do not match in both tables?',
      options: ['a) LEFT JOIN', 'b) RIGHT JOIN', 'c) FULL OUTER JOIN with condition', 'd) INNER JOIN'],
      correct: 'c'
    },
    {
      question: 'Which query is valid to delete duplicate rows keeping one copy?',
      options: ['a) DELETE FROM Employee WHERE id IN (SELECT MIN(id) GROUP BY name);', 'b) DELETE e1 FROM Employee e1, Employee e2 WHERE e1.name = e2.name AND e1.id > e2.id;', 'c) DELETE FROM Employee;', 'd) DELETE Employee WHERE name IN Employee;'],
      correct: 'b'
    },
    {
      question: 'Which is NOT a valid isolation level?',
      options: ['a) READ UNCOMMITTED', 'b) READ COMMITTED', 'c) REPEATABLE READ', 'd) REVERSE READ'],
      correct: 'd'
    },
    {
      question: 'What does the following query do?',
      code: 'SELECT ROW_NUMBER() OVER(PARTITION BY department_id ORDER BY salary DESC) AS rnum FROM Employee;',
      options: ['a) Gives global row number', 'b) Gives row number within each department', 'c) Gives rank with ties', 'd) Gives cumulative sum'],
      correct: 'b'
    },
    {
      question: 'Output if you run:',
      code: 'SELECT * FROM Employee e1 WHERE salary = (SELECT MAX(salary) FROM Employee e2 WHERE e1.department_id = e2.department_id);',
      options: ['a) Employees with max salary in each department', 'b) Employee with overall max salary', 'c) Syntax error', 'd) All employees'],
      correct: 'a'
    },
    {
      question: 'Which SQL statement prevents dirty reads?',
      options: ['a) SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED', 'b) SET TRANSACTION ISOLATION LEVEL READ COMMITTED', 'c) SET TRANSACTION ISOLATION LEVEL REPEATABLE READ', 'd) Both b & c'],
      correct: 'd'
    },
    {
      question: 'Which statement about subqueries is TRUE?',
      options: ['a) Can return scalar, row, or table', 'b) Must always be correlated', 'c) Cannot be in FROM clause', 'd) Cannot use aggregate functions'],
      correct: 'a'
    },
    {
      question: 'Output of below query if multiple employees have same max salary?',
      code: 'SELECT salary, RANK() OVER(ORDER BY salary DESC) AS rnk FROM Employee;',
      options: ['a) All get same rank', 'b) All get unique rank', 'c) Query fails', 'd) Only first gets rank 1'],
      correct: 'a'
    },
    {
      question: 'Which query ensures a column cannot have duplicates?',
      options: ['a) PRIMARY KEY', 'b) UNIQUE', 'c) INDEX', 'd) Both a & b'],
      correct: 'd'
    }
  ]

  const javaQuestions = [
    {
      question: 'Which of these is NOT stored in the JVM heap?',
      options: ['a) Object', 'b) Instance variable', 'c) Local variable', 'd) Array'],
      correct: 'c'
    },
    {
      question: 'What is true about final static variables?',
      options: ['a) Stored in heap', 'b) Stored in method area', 'c) Stored in stack', 'd) Stored in constant pool'],
      correct: 'b'
    },
    {
      question: 'Diamond problem in Java is solved by:',
      options: ['a) Multiple inheritance', 'b) Interfaces with default methods', 'c) Abstract classes', 'd) Constructors'],
      correct: 'b'
    },
    {
      question: 'Which collection is NOT thread-safe?',
      options: ['a) Vector', 'b) HashMap', 'c) Hashtable', 'd) StringBuffer'],
      correct: 'b'
    },
    {
      question: 'Output of this code:',
      code: 'int a = 5;\nSystem.out.println(a++ + ++a);',
      options: ['a) 11', 'b) 12', 'c) 10', 'd) Undefined'],
      correct: 'b'
    },
    {
      question: 'What is JVM garbage collector algorithm?',
      options: ['a) Mark-sweep', 'b) FIFO', 'c) LRU', 'd) BFS'],
      correct: 'a'
    },
    {
      question: 'A class with private constructor can be used for:',
      options: ['a) Normal object creation', 'b) Singleton pattern', 'c) Polymorphism', 'd) Inheritance'],
      correct: 'b'
    },
    {
      question: 'Which interface provides fail-fast behavior?',
      options: ['a) Vector', 'b) ArrayList', 'c) HashMap', 'd) ConcurrentHashMap'],
      correct: 'b'
    },
    {
      question: 'Which exception is unchecked?',
      options: ['a) IOException', 'b) SQLException', 'c) NullPointerException', 'd) ClassNotFoundException'],
      correct: 'c'
    },
    {
      question: 'Which is NOT part of Java memory model?',
      options: ['a) Heap', 'b) Method area', 'c) PermGen (Java 8+)', 'd) Stack'],
      correct: 'c'
    },
    {
      question: 'Output of below snippet:',
      code: 'String s1 = "Hello";\nString s2 = new String("Hello");\nSystem.out.println(s1 == s2);',
      options: ['a) true', 'b) false', 'c) Depends on JVM', 'd) Compilation error'],
      correct: 'b'
    },
    {
      question: 'What method is used by JVM to load classes?',
      options: ['a) Class.forName()', 'b) new ClassLoader()', 'c) ClassLoader.loadClass()', 'd) All of the above'],
      correct: 'c'
    },
    {
      question: 'What is true about synchronized keyword?',
      options: ['a) Locks object for single thread', 'b) Can lock method or block', 'c) Can be applied to static methods', 'd) All of the above'],
      correct: 'd'
    },
    {
      question: 'Which of the following is correct about Java generics?',
      options: ['a) Type erasure occurs at compile-time', 'b) Generic type info available at runtime', 'c) Cannot use wildcards', 'd) Can use primitives as generic type'],
      correct: 'a'
    },
    {
      question: 'Output of below code?',
      code: 'List<Integer> list = Arrays.asList(1,2,3);\nlist.add(4);',
      options: ['a) List becomes [1,2,3,4]', 'b) Throws UnsupportedOperationException', 'c) Compilation error', 'd) Runs with warning'],
      correct: 'b'
    },
    {
      question: 'Stream API: Which operation is intermediate?',
      options: ['a) forEach', 'b) map', 'c) collect', 'd) reduce'],
      correct: 'b'
    },
    {
      question: 'Difference between == and .equals() in Java:',
      options: ['a) == compares reference, .equals() compares content', 'b) == compares content, .equals() compares reference', 'c) Both compare content', 'd) Both compare reference'],
      correct: 'a'
    },
    {
      question: 'What happens if a thread calls wait() without owning lock?',
      options: ['a) Thread waits until notified', 'b) Throws IllegalMonitorStateException', 'c) Thread sleeps', 'd) Deadlock occurs'],
      correct: 'b'
    },
    {
      question: 'What is true about Java reflection?',
      options: ['a) Can modify private fields', 'b) Can call private methods', 'c) Can create objects dynamically', 'd) All of the above'],
      correct: 'd'
    },
    {
      question: 'Output of below snippet:',
      code: 'int[] arr = {1,2,3};\nint[] b = arr.clone();\narr[0] = 10;\nSystem.out.println(b[0]);',
      options: ['a) 1', 'b) 10', 'c) Error', 'd) 0'],
      correct: 'a'
    }
  ]

  const devopsQuestions = [
    {
      question: 'What is the primary goal of DevOps?',
      options: ['a) To increase development speed', 'b) To improve collaboration between development and operations', 'c) To reduce costs', 'd) To automate testing'],
      correct: 'b'
    },
    {
      question: 'Which tool is commonly used for continuous integration?',
      options: ['a) Docker', 'b) Jenkins', 'c) Kubernetes', 'd) Ansible'],
      correct: 'b'
    },
    {
      question: 'What does CI/CD stand for?',
      options: ['a) Continuous Integration/Continuous Deployment', 'b) Code Integration/Continuous Delivery', 'c) Continuous Implementation/Continuous Development', 'd) Code Implementation/Continuous Deployment'],
      correct: 'a'
    },
    {
      question: 'Which of the following is a containerization tool?',
      options: ['a) Jenkins', 'b) Docker', 'c) Git', 'd) Terraform'],
      correct: 'b'
    },
    {
      question: 'What is the purpose of Infrastructure as Code (IaC)?',
      options: ['a) To manually configure servers', 'b) To manage infrastructure through code', 'c) To monitor application performance', 'd) To automate testing'],
      correct: 'b'
    },
    {
      question: 'Which tool is used for configuration management?',
      options: ['a) Docker', 'b) Ansible', 'c) Kubernetes', 'd) Prometheus'],
      correct: 'b'
    },
    {
      question: 'What is a key benefit of using version control systems like Git?',
      options: ['a) Faster code execution', 'b) Collaboration and code tracking', 'c) Automatic deployment', 'd) Container management'],
      correct: 'b'
    },
    {
      question: 'Which cloud platform provides AWS CodePipeline?',
      options: ['a) Google Cloud', 'b) Microsoft Azure', 'c) Amazon Web Services', 'd) IBM Cloud'],
      correct: 'c'
    },
    {
      question: 'What is the role of a load balancer in DevOps?',
      options: ['a) To store application data', 'b) To distribute traffic across servers', 'c) To monitor code changes', 'd) To automate builds'],
      correct: 'b'
    },
    {
      question: 'Which monitoring tool is commonly used in DevOps?',
      options: ['a) Jenkins', 'b) Prometheus', 'c) Docker', 'd) Ansible'],
      correct: 'b'
    },
    {
      question: 'What does the term "blue-green deployment" refer to?',
      options: ['a) A type of container', 'b) A deployment strategy with two environments', 'c) A monitoring technique', 'd) A version control method'],
      correct: 'b'
    },
    {
      question: 'Which tool is used for container orchestration?',
      options: ['a) Docker', 'b) Jenkins', 'c) Kubernetes', 'd) Git'],
      correct: 'c'
    },
    {
      question: 'What is the purpose of a Dockerfile?',
      options: ['a) To define application configuration', 'b) To create container images', 'c) To manage infrastructure', 'd) To monitor applications'],
      correct: 'b'
    },
    {
      question: 'Which practice involves automatically rebuilding and testing code changes?',
      options: ['a) Continuous Deployment', 'b) Continuous Integration', 'c) Infrastructure as Code', 'd) Configuration Management'],
      correct: 'b'
    },
    {
      question: 'What is the main advantage of microservices architecture?',
      options: ['a) Easier deployment of individual components', 'b) Reduced need for monitoring', 'c) Simplified version control', 'd) Automatic scaling'],
      correct: 'a'
    },
    {
      question: 'Which tool is used for log aggregation in DevOps?',
      options: ['a) ELK Stack', 'b) Docker', 'c) Terraform', 'd) Ansible'],
      correct: 'a'
    },
    {
      question: 'What is the purpose of canary deployment?',
      options: ['a) To roll back changes quickly', 'b) To test new features on a subset of users', 'c) To monitor application health', 'd) To automate builds'],
      correct: 'b'
    },
    {
      question: 'Which of the following is a key principle of DevOps?',
      options: ['a) Siloed teams', 'b) Manual processes', 'c) Automation', 'd) Infrequent deployments'],
      correct: 'c'
    },
    {
      question: 'What does the term "shift-left testing" mean?',
      options: ['a) Testing later in the development cycle', 'b) Moving testing earlier in the development process', 'c) Using left-side monitoring tools', 'd) Shifting test environments to the cloud'],
      correct: 'b'
    },
    {
      question: 'Which tool is commonly used for infrastructure provisioning?',
      options: ['a) Jenkins', 'b) Terraform', 'c) Prometheus', 'd) Docker'],
      correct: 'b'
    }
  ]

  const digitalMarketingQuestions = [
    {
      question: 'What is SEO?',
      options: ['a) Search Engine Optimization - improving website visibility in search results', 'b) Social Engagement Optimization', 'c) Search Engine Operations', 'd) Site Enhancement Operations'],
      correct: 'a'
    },
    {
      question: 'Difference between on-page and off-page SEO.',
      options: ['a) On-page: content and HTML; Off-page: external links and social signals', 'b) On-page: external links; Off-page: content and HTML', 'c) On-page: social media; Off-page: website content', 'd) On-page: paid ads; Off-page: organic search'],
      correct: 'a'
    },
    {
      question: 'Explain Google Ads.',
      options: ['a) Pay-per-click advertising platform for promoting businesses on Google', 'b) Free advertising platform', 'c) Social media advertising tool', 'd) Email marketing platform'],
      correct: 'a'
    },
    {
      question: 'What is CTR?',
      options: ['a) Click-Through Rate - percentage of users who click on ad or link', 'b) Cost To Revenue ratio', 'c) Customer Transaction Rate', 'd) Content Transfer Rate'],
      correct: 'a'
    },
    {
      question: 'Difference between organic and paid traffic.',
      options: ['a) Organic: natural search results; Paid: advertising campaigns', 'b) Organic: paid ads; Paid: natural search', 'c) Organic: social media; Paid: search engines', 'd) Organic: email; Paid: direct traffic'],
      correct: 'a'
    },
    {
      question: 'What is SEM?',
      options: ['a) Search Engine Marketing - paid advertising on search engines', 'b) Social Email Marketing', 'c) Search Engine Management', 'd) Site Enhancement Marketing'],
      correct: 'a'
    },
    {
      question: 'Explain backlinks.',
      options: ['a) Links from other websites pointing to your site, important for SEO', 'b) Links within your own website', 'c) Links to social media profiles', 'd) Links in email signatures'],
      correct: 'a'
    },
    {
      question: 'What is keyword research?',
      options: ['a) Process of finding and analyzing search terms people use', 'b) Researching competitor websites', 'c) Analyzing website traffic', 'd) Testing website performance'],
      correct: 'a'
    },
    {
      question: 'Difference between CPC and CPM.',
      options: ['a) CPC: cost per click; CPM: cost per thousand impressions', 'b) CPC: cost per thousand; CPM: cost per click', 'c) CPC: cost per conversion; CPM: cost per click', 'd) CPC: cost per impression; CPM: cost per click'],
      correct: 'a'
    },
    {
      question: 'Explain Google Analytics.',
      options: ['a) Web analytics tool for tracking website traffic and user behavior', 'b) Advertising platform', 'c) Search engine tool', 'd) Social media analytics'],
      correct: 'a'
    },
    {
      question: 'What is conversion rate?',
      options: ['a) Percentage of visitors who complete desired action', 'b) Percentage of website traffic from search engines', 'c) Percentage of social media followers', 'd) Percentage of email subscribers'],
      correct: 'a'
    },
    {
      question: 'Difference between social media marketing and email marketing.',
      options: ['a) Social: platforms like Facebook, Twitter; Email: direct communication via email', 'b) Social: email platforms; Email: social platforms', 'c) Social: paid ads; Email: organic content', 'd) Social: search engines; Email: social platforms'],
      correct: 'a'
    },
    {
      question: 'What is content marketing?',
      options: ['a) Creating and distributing valuable content to attract target audience', 'b) Creating paid advertisements', 'c) Managing social media accounts', 'd) Optimizing website speed'],
      correct: 'a'
    },
    {
      question: 'What is affiliate marketing?',
      options: ['a) Performance-based marketing where affiliates earn commission for sales', 'b) Marketing through social media influencers', 'c) Direct email marketing', 'd) Search engine advertising'],
      correct: 'a'
    },
    {
      question: 'Difference between black hat and white hat SEO.',
      options: ['a) White hat: ethical practices; Black hat: manipulative techniques', 'b) White hat: manipulative; Black hat: ethical', 'c) White hat: paid; Black hat: organic', 'd) White hat: social; Black hat: search'],
      correct: 'a'
    },
    {
      question: 'What is remarketing?',
      options: ['a) Showing ads to people who previously visited your website', 'b) Marketing to new customers', 'c) Social media marketing', 'd) Email marketing campaigns'],
      correct: 'a'
    },
    {
      question: 'Explain lead generation.',
      options: ['a) Process of attracting and converting strangers into potential customers', 'b) Generating website traffic', 'c) Creating social media content', 'd) Managing customer relationships'],
      correct: 'a'
    },
    {
      question: 'What is a landing page?',
      options: ['a) Standalone web page created for specific marketing campaign', 'b) Homepage of a website', 'c) Social media profile page', 'd) Email template'],
      correct: 'a'
    },
    {
      question: 'What is A/B testing in marketing?',
      options: ['a) Comparing two versions of content to see which performs better', 'b) Testing website speed', 'c) Testing email deliverability', 'd) Testing social media algorithms'],
      correct: 'a'
    },
    {
      question: 'Difference between impressions and reach.',
      options: ['a) Impressions: number of times ad displayed; Reach: number of unique users who saw ad', 'b) Impressions: unique users; Reach: ad displays', 'c) Impressions: clicks; Reach: impressions', 'd) Impressions: conversions; Reach: impressions'],
      correct: 'a'
    }
  ]

  const sapQuestions = [
    {
      question: 'What does SAP stand for?',
      options: ['a) Systems, Applications and Products', 'b) Software Applications Platform', 'c) Systems Analysis Program', 'd) Strategic Application Planning'],
      correct: 'a'
    },
    {
      question: 'Which of the following is NOT a core SAP module?',
      options: ['a) FI (Financial Accounting)', 'b) CO (Controlling)', 'c) HR (Human Resources)', 'd) CRM (Customer Relationship Management)'],
      correct: 'd'
    },
    {
      question: 'What is the difference between SAP ECC and SAP S/4HANA?',
      options: ['a) ECC is cloud-based, S/4HANA is on-premise', 'b) S/4HANA uses HANA database with simplified data model', 'c) ECC supports more users than S/4HANA', 'd) S/4HANA is the predecessor of ECC'],
      correct: 'b'
    },
    {
      question: 'What is ABAP in SAP?',
      options: ['a) Advanced Business Application Programming', 'b) Automated Business Application Process', 'c) Application Business Analysis Program', 'd) Advanced Business Analytics Platform'],
      correct: 'a'
    },
    {
      question: 'Which SAP module handles procurement and inventory management?',
      options: ['a) SD (Sales & Distribution)', 'b) MM (Materials Management)', 'c) PP (Production Planning)', 'd) QM (Quality Management)'],
      correct: 'b'
    },
    {
      question: 'What is the primary function of SAP FICO?',
      options: ['a) Financial Accounting and Controlling', 'b) Fixed Assets and Inventory Control', 'c) Financial Integration and Cost Optimization', 'd) Fiscal Information and Compliance Operations'],
      correct: 'a'
    },
    {
      question: 'Which SAP module manages sales orders and billing?',
      options: ['a) MM (Materials Management)', 'b) SD (Sales & Distribution)', 'c) PP (Production Planning)', 'd) WM (Warehouse Management)'],
      correct: 'b'
    },
    {
      question: 'What is SAP HANA?',
      options: ['a) A programming language', 'b) An in-memory database platform', 'c) A user interface framework', 'd) A workflow management tool'],
      correct: 'b'
    },
    {
      question: 'What does IDoc stand for in SAP?',
      options: ['a) Intermediate Document', 'b) Integrated Data Object', 'c) Interface Data Object', 'd) Internal Document Object'],
      correct: 'a'
    },
    {
      question: 'Which tool is used for data migration in SAP?',
      options: ['a) LSMW (Legacy System Migration Workbench)', 'b) SE80 (ABAP Workbench)', 'c) SE38 (ABAP Editor)', 'd) SM37 (Job Overview)'],
      correct: 'a'
    },
    {
      question: 'What is a client in SAP system?',
      options: ['a) A separate database instance', 'b) An independent unit with master data and transactions', 'c) A user interface component', 'd) A programming module'],
      correct: 'b'
    },
    {
      question: 'What is SAP UI5?',
      options: ['a) A database management system', 'b) A JavaScript framework for web applications', 'c) A workflow engine', 'd) An integration tool'],
      correct: 'b'
    },
    {
      question: 'Which SAP component handles employee data and payroll?',
      options: ['a) FI (Financial Accounting)', 'b) CO (Controlling)', 'c) HR (Human Resources)', 'd) SD (Sales & Distribution)'],
      correct: 'c'
    },
    {
      question: 'What is ALE in SAP?',
      options: ['a) Application Link Enabling', 'b) Advanced Logistics Engine', 'c) Automated Link Exchange', 'd) Application Layer Encryption'],
      correct: 'a'
    },
    {
      question: 'What are transparent tables in SAP?',
      options: ['a) Tables that store temporary data', 'b) Database tables with one-to-one relationship to database tables', 'c) Tables for storing configuration data', 'd) Tables for audit logging'],
      correct: 'b'
    },
    {
      question: 'What is SAP Solution Manager used for?',
      options: ['a) Database administration', 'b) Application lifecycle management', 'c) User interface design', 'd) Data migration'],
      correct: 'b'
    },
    {
      question: 'What is a BAPI in SAP?',
      options: ['a) Business Application Programming Interface', 'b) Basic Application Processing Interface', 'c) Business Analytics Programming Interface', 'd) Backend Application Processing Interface'],
      correct: 'a'
    },
    {
      question: 'Which transaction code is used to create a new user in SAP?',
      options: ['a) SU01', 'b) SE01', 'c) SM01', 'd) ST01'],
      correct: 'a'
    },
    {
      question: 'What is SAP BW/BI?',
      options: ['a) Business Warehouse/Business Intelligence', 'b) Business Workflow/Business Integration', 'c) Business Web/Business Intelligence', 'd) Business Warehouse/Business Integration'],
      correct: 'a'
    },
    {
      question: 'What is the purpose of SAP transport requests?',
      options: ['a) To transport goods between warehouses', 'b) To move changes between SAP systems', 'c) To transport data between modules', 'd) To request system resources'],
      correct: 'b'
    }
  ]

  const handleStartExam = (examType) => {
    setExamType(examType)
    setShowExam(true)
    setSelectedAnswers({})
    setSubmitted(false)
    setScore(0)
  }

  const handleAnswerSelect = (questionIndex, answer) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }))
  }

  const handleSubmit = () => {
    let correctCount = 0
    let currentQuestions
    if (examType === 'SQL') {
      currentQuestions = sqlQuestions
    } else if (examType === 'Java') {
      currentQuestions = javaQuestions
    } else {
      currentQuestions = pythonQuestions
    }
    currentQuestions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correct) {
        correctCount++
      }
    })
    setScore(correctCount)
    setSubmitted(true)
  }

  const handleBackToMock = () => {
    setShowExam(false)
    setSelectedAnswers({})
    setSubmitted(false)
    setScore(0)
  }

  const renderEmptyState = (title, message) => (
    <div className="bg-white/90 border border-slate-200/70 rounded-2xl p-8 text-center shadow-[0_18px_40px_rgba(2,6,23,0.45)]">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-600 mt-2">{message}</p>
    </div>
  )

  const getCurrentPage = (sectionKey, totalCount) => {
    const current = Number(questionPages[sectionKey] ?? 0)
    if (!Number.isFinite(current)) return 0
    if (current < 0 || current >= totalCount) return 0
    return current
  }

  const handleFlipPage = (sectionKey, totalCount, direction) => {
    if (!totalCount) return
    setQuestionPages((prev) => {
      const current = getCurrentPage(sectionKey, totalCount)
      const next = Math.min(Math.max(current + direction, 0), totalCount - 1)
      if (next === current) return prev
      return { ...prev, [sectionKey]: next }
    })
    setFlipDirectionBySection((prev) => ({
      ...prev,
      [sectionKey]: direction > 0 ? 'next' : 'prev'
    }))
  }

  const renderFlipQuestionBook = (questions, sectionKey) => {
    if (!Array.isArray(questions) || questions.length === 0) {
      return renderEmptyState('No questions available', 'We are adding more questions for this topic.')
    }

    const totalCount = questions.length
    const currentPage = getCurrentPage(sectionKey, totalCount)
    const currentItem = questions[currentPage]
    const flipDirection = flipDirectionBySection[sectionKey]
    const answerKey = `${sectionKey}-${currentPage}`
    const isAnswerVisible = Boolean(revealedAnswers[answerKey])
    const animationClass = flipDirection
      ? (flipDirection === 'next'
          ? 'animate-[flipPageNext_420ms_ease]'
          : 'animate-[flipPagePrev_420ms_ease]')
      : ''

    return (
      <div className="space-y-4">
        <div className="relative [perspective:1800px]">
          <article
            key={`${sectionKey}-${currentPage}-${flipDirection || 'none'}`}
            className={`rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-5 shadow-[0_16px_35px_rgba(2,6,23,0.2)] [transform-origin:left_center] ${animationClass}`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Question {currentPage + 1} / {totalCount}
            </p>
            <p className="mt-3 text-base font-semibold text-slate-900">{currentItem.question}</p>
            <button
              type="button"
              onClick={() =>
                setRevealedAnswers((prev) => ({
                  ...prev,
                  [answerKey]: !prev[answerKey]
                }))
              }
              className="mt-4 inline-flex items-center rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-indigo-700 transition hover:bg-indigo-100"
            >
              {isAnswerVisible ? 'Hide Answer' : 'Answer'}
            </button>
            {isAnswerVisible && (
              <div className="mt-3 rounded-xl border border-emerald-200/70 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <span className="font-semibold">Answer: </span>
                {currentItem.answer}
              </div>
            )}
          </article>
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => handleFlipPage(sectionKey, totalCount, -1)}
            disabled={currentPage === 0}
            className="rounded-lg border border-slate-300 bg-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-800 transition hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Page {currentPage + 1} of {totalCount}
          </span>
          <button
            type="button"
            onClick={() => handleFlipPage(sectionKey, totalCount, 1)}
            disabled={currentPage === totalCount - 1}
            className="rounded-lg border border-emerald-300 bg-emerald-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-900 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'aptitude':
        if (
          aptitudeData.quantitative.length === 0 &&
          aptitudeData.logical.length === 0 &&
          aptitudeData.verbal.length === 0
        ) {
          return renderEmptyState('No aptitude questions yet', 'Check back soon for new practice sets.')
        }
        return (
          <div className="space-y-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Practice Categories</h2>
                <p className="text-sm text-slate-600">Choose a focus area and review sample questions.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Difficulty Level</span>
                <span className="px-3 py-1 rounded-lg bg-white/80 border border-slate-200/70 text-xs text-slate-700">Beginner</span>
                <span className="px-3 py-1 rounded-lg bg-white/80 border border-slate-200/70 text-xs text-slate-700">Intermediate</span>
                <span className="px-3 py-1 rounded-lg bg-white/80 border border-slate-200/70 text-xs text-slate-700">Advanced</span>
              </div>
            </div>
            <div className="bg-white/90 p-6 rounded-2xl border border-slate-200/70 shadow-[0_18px_40px_rgba(2,6,23,0.45)]">
              <div className="flex flex-wrap items-center gap-2 mb-5">
                {[
                  { id: 'quantitative', label: 'Quantitative Aptitude' },
                  { id: 'logical', label: 'Logical Reasoning' },
                  { id: 'verbal', label: 'Verbal Ability' }
                ].map((topic) => (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => setAptitudeTopic(topic.id)}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition ${
                      aptitudeTopic === topic.id
                        ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {topic.label}
                  </button>
                ))}
              </div>
              {aptitudeTopic === 'quantitative' && renderFlipQuestionBook(aptitudeData.quantitative, 'aptitude-quantitative')}
              {aptitudeTopic === 'logical' && renderFlipQuestionBook(aptitudeData.logical, 'aptitude-logical')}
              {aptitudeTopic === 'verbal' && renderFlipQuestionBook(aptitudeData.verbal, 'aptitude-verbal')}
            </div>
          </div>
        )

      case 'technical':
        if (Object.keys(technicalData).length === 0) {
          return renderEmptyState('No technical categories yet', 'New question banks are being prepared.')
        }
        return (
          <div className="space-y-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Practice Categories</h2>
                <p className="text-sm text-slate-600">Explore role-specific question sets by topic.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Difficulty Level</span>
                <span className="px-3 py-1 rounded-lg bg-white/80 border border-slate-200/70 text-xs text-slate-700">Core</span>
                <span className="px-3 py-1 rounded-lg bg-white/80 border border-slate-200/70 text-xs text-slate-700">Intermediate</span>
                <span className="px-3 py-1 rounded-lg bg-white/80 border border-slate-200/70 text-xs text-slate-700">Advanced</span>
              </div>
            </div>
            <div className="bg-white/90 p-6 rounded-2xl border border-slate-200/70 shadow-[0_18px_40px_rgba(2,6,23,0.45)]">
              <div className="flex flex-wrap items-center gap-2 mb-5">
                {Object.keys(technicalData).map((tech) => (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => setTechnicalTopic(tech)}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition ${
                      technicalTopic === tech
                        ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {tech}
                  </button>
                ))}
              </div>
              <h3 className="text-xl font-bold text-indigo-200 mb-4 capitalize">{technicalTopic}</h3>
              {renderFlipQuestionBook(technicalData[technicalTopic] || [], `technical-${technicalTopic}`)}
            </div>
          </div>
        )

      case 'hr':
        if (hrQuestions.length === 0) {
          return renderEmptyState('No HR questions yet', 'Check back soon for interview prompts.')
        }
        return (
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Question List</h2>
                <p className="text-sm text-slate-600">Prep for common behavioral and situational prompts.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Difficulty Level</span>
                <span className="px-3 py-1 rounded-lg bg-white/80 border border-slate-200/70 text-xs text-slate-700">Behavioral</span>
              </div>
            </div>
            <div className="bg-white/90 p-6 rounded-2xl border border-slate-200/70 shadow-[0_18px_40px_rgba(2,6,23,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_50px_rgba(2,6,23,0.6)]">
              <h3 className="text-xl font-bold text-emerald-700 mb-4">Common HR Interview Questions</h3>
              <div className="space-y-4">
                {hrQuestions.map((item, index) => (
                  <div key={index} className="border-b border-slate-200/70 pb-4">
                    <p className="font-medium text-lg">{item.question}</p>
                    <p className="text-indigo-700 text-sm font-medium">?? {item.tips}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl">
                <h4 className="font-bold text-emerald-700 mb-3">Do's</h4>
                <ul className="space-y-2 text-sm">
                  <li>- Be honest and authentic</li>
                  <li>- Show enthusiasm</li>
                  <li>- Ask thoughtful questions</li>
                  <li>- Follow up after interview</li>
                </ul>
              </div>
              <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-2xl">
                <h4 className="font-bold text-rose-700 mb-3">Don'ts</h4>
                <ul className="space-y-2 text-sm">
                  <li>- Don't badmouth previous employers</li>
                  <li>- Don't be negative</li>
                  <li>- Don't lie or exaggerate</li>
                  <li>- Don't forget to research the company</li>
                </ul>
              </div>
            </div>
          </div>
        )

      case 'resume':
        if (resumeTips.length === 0) {
          return renderEmptyState('No resume tips yet', 'We are updating this section with new guidance.')
        }
        return (
          <div className="space-y-6">
            <div className="bg-white/90 p-6 rounded-2xl border border-slate-200/70 shadow-[0_18px_40px_rgba(2,6,23,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_50px_rgba(2,6,23,0.6)]">
              <h3 className="text-xl font-bold text-indigo-200 mb-4">Resume Writing Tips</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold mb-3">Essential Tips</h4>
                  <ul className="space-y-2">
                    {resumeTips.map((tip, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-emerald-300 mr-2">?</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold mb-3">Resume Summary Examples</h4>
                  <div className="bg-white/80 border border-slate-200/70 p-3 rounded-xl text-sm text-slate-600">
                    "Results-driven software developer with 3+ years of experience in full-stack development,
                    specializing in React and Node.js. Proven track record of delivering scalable solutions
                    and improving application performance by 40%."
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/90 p-6 rounded-2xl border border-slate-200/70 shadow-[0_18px_40px_rgba(2,6,23,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_50px_rgba(2,6,23,0.6)]">
              <h3 className="text-xl font-bold text-rose-700 mb-4">Common Mistakes to Avoid</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                  <div className="text-2xl mb-2">??</div>
                  <p className="font-medium">Typos & Grammar Errors</p>
                </div>
                <div className="text-center p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                  <div className="text-2xl mb-2">??</div>
                  <p className="font-medium">Generic Content</p>
                </div>
                <div className="text-center p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                  <div className="text-2xl mb-2">??</div>
                  <p className="font-medium">Too Long Resume</p>
                </div>
              </div>
            </div>
          </div>
        )

      case 'interview-tips':
        if (interviewTips.length === 0) {
          return renderEmptyState('No interview tips yet', 'Return soon for fresh advice and examples.')
        }
        return (
          <div className="space-y-8">
            {interviewTips.map((category, index) => (
              <div key={index} className="bg-white/90 p-6 rounded-2xl border border-slate-200/70 shadow-[0_18px_40px_rgba(2,6,23,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_50px_rgba(2,6,23,0.6)]">
                <h3 className="text-xl font-bold text-indigo-200 mb-4">{category.category}</h3>
                <ul className="space-y-2">
                  {category.tips.map((tip, tipIndex) => (
                    <li key={tipIndex} className="flex items-start">
                      <span className="text-indigo-600 mr-2">??</span>
                      <span className="text-sm">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )

      case 'mock':
        const mockCategories = ['Python', 'SQL', 'Java', 'DevOps', 'SAP', 'Aptitude', 'Digital Marketing', 'General Technical', 'HR']
        if (showExam) {
          return (
            <div className="space-y-6">
              <div className="bg-white/90 p-6 rounded-2xl border border-slate-200/70 shadow-[0_18px_40px_rgba(2,6,23,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_50px_rgba(2,6,23,0.6)]">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-violet-700">{examType} Mock Interview</h3>
                  <button
                    onClick={handleBackToMock}
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg bg-white/90 text-slate-700 ring-1 ring-slate-700/70 shadow-[inset_0_1px_0_rgba(148,163,184,0.08),_0_8px_16px_rgba(2,6,23,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  >
                    Back to Categories
                  </button>
                </div>

                {!submitted ? (
                  <div key="questions" className="space-y-6">
                    {(() => {
                      let currentQuestions;
                      if (examType === 'SQL') {
                        currentQuestions = sqlQuestions;
                      } else if (examType === 'Java') {
                        currentQuestions = javaQuestions;
                      } else if (examType === 'Python') {
                        currentQuestions = pythonQuestions;
                      } else if (examType === 'DevOps') {
                        currentQuestions = devopsQuestions;
                      } else if (examType === 'SAP') {
                        currentQuestions = sapQuestions;
                      } else if (examType === 'Digital Marketing') {
                        currentQuestions = digitalMarketingQuestions;
                      } else if (examType === 'Aptitude') {
                        currentQuestions = aptitudeData.quantitative.map((item, index) => ({
                          question: item.question,
                          options: ['a) ' + item.answer, 'b) Wrong answer', 'c) Another wrong answer', 'd) Yet another wrong answer'],
                          correct: 'a'
                        }));
                      } else if (examType === 'General Technical') {
                        currentQuestions = technicalData.python.map((item, index) => ({
                          question: item.question,
                          options: ['a) ' + item.answer, 'b) Wrong answer', 'c) Another wrong answer', 'd) Yet another wrong answer'],
                          correct: 'a'
                        }));
                      } else if (examType === 'HR') {
                        currentQuestions = hrQuestions.map((item, index) => ({
                          question: item.question,
                          options: ['a) ' + item.tips, 'b) Wrong answer', 'c) Another wrong answer', 'd) Yet another wrong answer'],
                          correct: 'a'
                        }));
                      } else {
                        currentQuestions = pythonQuestions; // default fallback
                      }
                      if (!currentQuestions || currentQuestions.length === 0) {
                        return (
                          <div className="py-6">
                            {renderEmptyState('No questions in this mock yet', 'Pick another category or check back later.')}
                          </div>
                        )
                      }
                      return currentQuestions.map((q, index) => (
                        <div key={index} className="border-b border-slate-200/70 pb-6">
                          <h4 className="font-bold text-lg mb-3">Question {index + 1}:</h4>
                          <p className="mb-3">{q.question}</p>
                          {q.code && (
                            <pre className="bg-white/80 border border-slate-200/70 p-3 rounded-xl mb-3 text-sm text-slate-700 overflow-x-auto">
                              {q.code}
                            </pre>
                          )}
                          <div className="space-y-2">
                            {q.options.map((option, optIndex) => (
                              <label key={optIndex} className="flex items-center">
                                <input
                                  type="radio"
                                  name={`question-${index}`}
                                  value={String.fromCharCode(97 + optIndex)}
                                  checked={selectedAnswers[index] === String.fromCharCode(97 + optIndex)}
                                  onChange={() => handleAnswerSelect(index, String.fromCharCode(97 + optIndex))}
                                  className="mr-2"
                                />
                                {option}
                              </label>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                    <div className="text-center">
                      <button
                        onClick={handleSubmit}
                        className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-[0_10px_24px_rgba(76,29,149,0.35)] ring-1 ring-slate-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(76,29,149,0.45)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 px-8 py-3"
                        disabled={Object.keys(selectedAnswers).length !== (() => {
                          if (examType === 'SQL') return sqlQuestions.length;
                          if (examType === 'Java') return javaQuestions.length;
                          return pythonQuestions.length;
                        })()}
                      >
                        Submit Exam
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key="results" className="text-center space-y-4">
                    <h4 className="text-2xl font-bold text-emerald-700">Exam Completed!</h4>
                    <div className="text-lg">
                      <p>Your Score: <span className="font-bold text-indigo-200">{score}/{(() => {
                        if (examType === 'SQL') return sqlQuestions.length;
                        if (examType === 'Java') return javaQuestions.length;
                        return pythonQuestions.length;
                      })()}</span></p>
                      <p>Percentage: <span className="font-bold text-violet-700">{Math.round((score / (() => {
                        if (examType === 'SQL') return sqlQuestions.length;
                        if (examType === 'Java') return javaQuestions.length;
                        return pythonQuestions.length;
                      })()) * 100)}%</span></p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
                        <h5 className="font-bold text-emerald-700 mb-2">Correct Answers ({score})</h5>
                        <ul className="text-sm space-y-1">
                          {(() => {
                            let currentQuestions;
                            if (examType === 'SQL') {
                              currentQuestions = sqlQuestions;
                            } else if (examType === 'Java') {
                              currentQuestions = javaQuestions;
                            } else {
                              currentQuestions = pythonQuestions;
                            }
                            return currentQuestions
                              .map((q, index) => ({ q, index }))
                              .filter(({ q, index }) => selectedAnswers[index] === q.correct)
                              .map(({ q, index }) => (
                                <li key={index} className="text-emerald-700">
                                  Q{index + 1}: {q.options.find(opt => opt.startsWith(q.correct + ')'))?.substring(3)}
                                </li>
                              ));
                          })()}
                        </ul>
                      </div>

                      <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl">
                        <h5 className="font-bold text-rose-700 mb-2">Incorrect Answers ({(() => {
                          if (examType === 'SQL') return sqlQuestions.length;
                          if (examType === 'Java') return javaQuestions.length;
                          return pythonQuestions.length;
                        })() - score})</h5>
                        <ul className="text-sm space-y-1">
                          {(() => {
                            let currentQuestions;
                            if (examType === 'SQL') {
                              currentQuestions = sqlQuestions;
                            } else if (examType === 'Java') {
                              currentQuestions = javaQuestions;
                            } else {
                              currentQuestions = pythonQuestions;
                            }
                            return currentQuestions
                              .map((q, index) => ({ q, index }))
                              .filter(({ q, index }) => selectedAnswers[index] !== q.correct)
                              .map(({ q, index }) => (
                                <li key={index} className="text-rose-700">
                                  Q{index + 1}: Your answer - {q.options.find(opt => opt.startsWith(selectedAnswers[index] + ')'))?.substring(3)}
                                  <br />
                                  <span className="text-emerald-700">Correct: {q.options.find(opt => opt.startsWith(q.correct + ')'))?.substring(3)}</span>
                                </li>
                              ));
                          })()}
                        </ul>
                      </div>
                    </div>

                    <button
                      onClick={handleBackToMock}
                      className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-[0_10px_24px_rgba(76,29,149,0.35)] ring-1 ring-slate-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(76,29,149,0.45)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 mt-6"
                    >
                      Take Another Exam
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        } else {
          if (mockCategories.length === 0) {
            return renderEmptyState('No mock categories yet', 'New mock interviews are on the way.')
          }
          return (
            <div className="space-y-6">
              <div className="bg-white/90 p-6 rounded-2xl border border-slate-200/70 shadow-[0_18px_40px_rgba(2,6,23,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_50px_rgba(2,6,23,0.6)]">
                <h3 className="text-xl font-bold text-violet-700 mb-4">Mock Interview Practice</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mockCategories.map((category, index) => (
                    <button
                      key={index}
                      className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-[0_10px_24px_rgba(76,29,149,0.35)] ring-1 ring-slate-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(76,29,149,0.45)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-full"
                      onClick={() => handleStartExam(category)}
                    >
                      Start {category} Mock Interview
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )
        }

      case 'personality':
        return (
          <div className="space-y-6">
            <div className="bg-white/90 p-6 rounded-2xl border border-slate-200/70 shadow-[0_18px_40px_rgba(2,6,23,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_50px_rgba(2,6,23,0.6)]">
              <h3 className="text-xl font-bold text-violet-700 mb-4">Personality Development Skills</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {personalityDev.map((skill, index) => (
                  <div key={index} className="text-center p-4 bg-white/80 border border-slate-200/70 rounded-xl">
                    <div className="text-2xl mb-2">??</div>
                    <p className="font-medium">{skill}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/90 p-6 rounded-2xl border border-slate-200/70 shadow-[0_18px_40px_rgba(2,6,23,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_50px_rgba(2,6,23,0.6)]">
                <h3 className="text-xl font-bold text-emerald-700 mb-4">Soft Skills</h3>
                <ul className="space-y-2">
                  <li className="flex items-center"><span className="text-emerald-300 mr-2">?</span>Communication</li>
                  <li className="flex items-center"><span className="text-emerald-300 mr-2">?</span>Teamwork</li>
                  <li className="flex items-center"><span className="text-emerald-300 mr-2">?</span>Problem Solving</li>
                  <li className="flex items-center"><span className="text-emerald-300 mr-2">?</span>Time Management</li>
                </ul>
              </div>

              <div className="bg-white/90 p-6 rounded-2xl border border-slate-200/70 shadow-[0_18px_40px_rgba(2,6,23,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_50px_rgba(2,6,23,0.6)]">
                <h3 className="text-xl font-bold text-indigo-200 mb-4">Body Language</h3>
                <ul className="space-y-2">
                  <li className="flex items-center"><span className="text-indigo-600 mr-2">??</span>Confident Posture</li>
                  <li className="flex items-center"><span className="text-indigo-600 mr-2">??</span>Eye Contact</li>
                  <li className="flex items-center"><span className="text-indigo-600 mr-2">??</span>Firm Handshake</li>
                  <li className="flex items-center"><span className="text-indigo-600 mr-2">??</span>Smile</li>
                </ul>
              </div>
            </div>
          </div>
        )

      case 'gd':
        return (
          <div className="space-y-6">
            <div className="bg-white/90 p-6 rounded-2xl border border-slate-200/70 shadow-[0_18px_40px_rgba(2,6,23,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_50px_rgba(2,6,23,0.6)]">
              <h3 className="text-xl font-bold text-orange-600 mb-4">Latest Group Discussion Topics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gdTopics.map((topic, index) => (
                  <div key={index} className="p-3 bg-white/80 border border-slate-200/70 rounded-xl">
                    <p className="font-medium">{topic}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl">
                <h4 className="font-bold text-emerald-700 mb-3">Do's in GD</h4>
                <ul className="space-y-2 text-sm">
                  <li>- Speak clearly and confidently</li>
                  <li>- Listen to others actively</li>
                  <li>- Respect different opinions</li>
                  <li>- Contribute meaningfully</li>
                  <li>- Maintain positive body language</li>
                </ul>
              </div>

              <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-2xl">
                <h4 className="font-bold text-rose-700 mb-3">Don'ts in GD</h4>
                <ul className="space-y-2 text-sm">
                  <li>- Don't dominate the discussion</li>
                  <li>- Don't interrupt others</li>
                  <li>- Don't be aggressive or rude</li>
                  <li>- Don't go off-topic</li>
                  <li>- Don't remain completely silent</li>
                </ul>
              </div>
            </div>

            
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      <Head>
        <title>Interview Preparation - TrueHire</title>
        <meta name="description" content="Comprehensive interview preparation resources including aptitude, technical, HR questions, resume tips, and mock interviews." />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-[#F9FAFB] via-[#F3F4FF] to-[#EEF2FF] py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-slate-700">
          {/* Header */}
          <div className="text-center mb-12">
            <Link href="/career" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700 mb-4">
              ? Back to Career Resources
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Interview <span className="text-gradient">Practice</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Master your interview skills with comprehensive preparation resources, practice questions, and expert tips
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-[0_18px_40px_-32px_rgba(15,23,42,0.35)] mb-8 overflow-x-auto">
            <div className="flex flex-wrap gap-2 p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 ${
                    activeTab === tab.id
                      ? 'text-slate-900 bg-white shadow-[inset_0_-2px_0_rgba(99,102,241,0.7),_0_8px_18px_-12px_rgba(15,23,42,0.35)]'
                      : 'text-slate-600 hover:text-slate-700 hover:bg-white'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="mb-12">
            {renderContent()}
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes flipPageNext {
          0% {
            opacity: 0;
            transform: rotateY(-24deg) translateX(18px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: rotateY(0deg) translateX(0) scale(1);
          }
        }

        @keyframes flipPagePrev {
          0% {
            opacity: 0;
            transform: rotateY(24deg) translateX(-18px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: rotateY(0deg) translateX(0) scale(1);
          }
        }
      `}</style>
    </>
  )
}

















