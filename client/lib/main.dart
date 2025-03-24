import 'package:flutter/material.dart';
import 'add_clip.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CCIM - Common Clip IMproved',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primaryColor: Colors.green,
        secondaryHeaderColor: Colors.red,
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.lightBlue),
        useMaterial3: true,
      ),
      home: const HomePage(),
    );
  }
}

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return MyScaffold(body: ViewClipsBody());
  }
}

class MyScaffold extends StatelessWidget {
  const MyScaffold({super.key, required this.body});

  final Widget body;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('CCIM', style: TextStyle(fontWeight: FontWeight.w900)),
        elevation: 1,
        shadowColor: Colors.black,
        actions: [
          IconButton(onPressed: () {}, icon: Icon(Icons.light_mode_rounded)),
        ],
        actionsPadding: EdgeInsets.symmetric(horizontal: 20),
      ),
      body: body,
      floatingActionButton: FloatingButton(),
    );
  }
}

class FloatingButton extends StatelessWidget {
  const FloatingButton({super.key});

  @override
  Widget build(BuildContext context) {
    return IconButton(
      onPressed: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => AddClipPage()),
        );
      },
      icon: Icon(Icons.add_rounded, size: 32,),
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.black87,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }
}

class ViewClipsBody extends StatelessWidget {
  const ViewClipsBody({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: 20, vertical: 30),
        child: Column(spacing: 40, children: [SearchBar(), Clips()]),
      ),
    );
  }
}

class Clips extends StatelessWidget {
  const Clips({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Card.outlined(
          margin: EdgeInsets.symmetric(vertical: 8),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  spacing: 10,
                  children: [
                    Icon(Icons.arrow_forward_ios_rounded),
                    Text('Something here'),
                  ],
                ),
                Icon(Icons.public, color: Colors.black87),
              ],
            ),
          ),
        ),
        Card.outlined(
          margin: EdgeInsets.symmetric(vertical: 8),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  spacing: 10,
                  children: [
                    Icon(Icons.arrow_forward_ios_rounded),
                    Text('Something private here'),
                  ],
                ),
                Icon(Icons.lock, color: Colors.black87),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class SearchBar extends StatelessWidget {
  const SearchBar({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.grey.shade200,
        borderRadius: BorderRadius.circular(100),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10),
        child: TextField(
          decoration: InputDecoration(
            hintText: 'Search clip',
            prefixIcon: Icon(Icons.search),
            enabledBorder: InputBorder.none,
            focusedBorder: InputBorder.none,
          ),
        ),
      ),
    );
  }
}
