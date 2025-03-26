import 'package:ccim_client/pages/view_clips.dart';
import 'package:flutter/material.dart';
import 'pages/add_clip.dart';

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
        // primarySwatch: Colors.blue,
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.blue,
        ).copyWith(primary: Colors.blue.shade600),
        useMaterial3: true,
      ),
      home: const ViewClipsPage(),
    );
  }
}

class MyScaffold extends StatelessWidget {
  const MyScaffold({
    super.key,
    required this.body,
    required this.showFloatingActionButton,
  });

  final Widget body;
  final bool showFloatingActionButton;

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
      floatingActionButton: showFloatingActionButton ? FloatingButton() : null,
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
          MaterialPageRoute(builder: (_) => AddClipsPage()),
        );
      },
      icon: Icon(Icons.add_rounded, size: 32),
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.black87,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }
}
